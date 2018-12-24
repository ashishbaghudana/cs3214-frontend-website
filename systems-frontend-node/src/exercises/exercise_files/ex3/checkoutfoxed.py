#!/usr/bin/python
#
# Utility to run outfoxed exercise
#
# Written for CS3214 Spring 2016 by G. Back (godmar@gmail.com)
#

import re, os, sys, subprocess, operator, signal, resource, getopt

exe = "./outfoxed"
debug_exe = "./outfoxed.debug"
helgrind = ["valgrind", "--tool=helgrind", "--fair-sched=yes"]

ex_dir = os.path.dirname(os.path.realpath(__file__))
driver_cfile = "%s/outfoxed-driver.c" % (ex_dir)
sol_cfile = "outfoxed.c"

grade = False
# number of tests
NTEST = 100
# number of CPUs on which to run tests, used round-robin
cpus = [4, 8, 10, 20, 2]

try:
    opts, args = getopt.getopt(sys.argv[1:], "gfn:s:", ["force", "ntests"])
except getopt.GetoptError, err:
    print str(err)
    sys.exit(2)

force = False
for opt, arg in opts:
    if opt == "-f":
        force = True
    if opt == "-n":
        NTEST = int(arg)
    if opt == "-s":
        sol_cfile = arg
    if opt == '-g':
      grade = True

if len(args) < 1:
    print "Usage: %s [-f] [-n <ntests>] [-s <solutionfile.c>] <gamecode>" % (sys.argv[0])
    sys.exit()

code = int(args[0])

# from http://stackoverflow.com/questions/2281850/timeout-function-if-it-takes-too-long-to-finish
from functools import wraps
import errno, signal

class TimeoutError(Exception):
    pass

def timeout(seconds=10, error_message=os.strerror(errno.ETIME)):
    def decorator(func):
        def _handle_timeout(signum, frame):
            raise TimeoutError(error_message)

        def wrapper(*args, **kwargs):
            signal.signal(signal.SIGALRM, _handle_timeout)
            signal.alarm(seconds)
            try:
                result = func(*args, **kwargs)
            finally:
                signal.alarm(0)
            return result

        return wraps(func)(wrapper)

    return decorator

if not os.access(sol_cfile, os.R_OK):
    raise Exception(sol_cfile + " not found in the current directory. ")

print "Compiling..."
compile_cmd = "gcc -I%s -pthread -std=gnu11 -O2 -Wall -Werror %s %s -o %s" % (ex_dir, sol_cfile, driver_cfile, exe)

if os.system(compile_cmd):
    raise Exception("Compile failed, run\n\n%s\n\nto see why" % compile_cmd)

if not os.access(exe, os.X_OK):
    raise Exception(exe + " did not build")

print "Ok."

# test scenarios (#threads, #tasks)

def check_one_run(sp, output):

    if sp.returncode < 0:
        signames = dict((k, v) for v, k in signal.__dict__.iteritems() if v.startswith('SIG'))
        signum = -sp.returncode
        print "Program terminated with signal %d (%s)\n" % (signum, signames[signum])
        lines = output.split("\n")
        if len(lines) > 1:
            print "Last line output was:"
            print lines[-2]

        return False

    expected = r'^A chicken detective has caught the thief!  It was: \S+$'
    lines = output.split("\n")

    if len(lines) != 53:
        print "Program did not output the expected number of lines (53)"
        print "Check that you do not have additional output to stdout."
        print "Keep output to stderr to a minimum."
        return False

    if not all(re.match(expected, line) for line in output.split("\n")[2:-1]):
        print "Output did not match expected format."
        return False

    return True

@timeout(seconds=3)
def run_one(n):
    """
    Run once using CPU 0...n-1
    """
    cmd = ["taskset", "-c", ",".join(map(str, range(n))), exe, str(code)]
    #print " ".join(cmd)
    try:
      sp = subprocess.Popen(cmd, stdout=subprocess.PIPE)
      output = sp.communicate()[0]

      return check_one_run(sp, output)
    finally:
      if sp:
        try:
          sp.kill()
        except:
          pass

@timeout(seconds=20)
def run_on_one_cpu():
    """
    Run on one CPU to check for busy-waiting.
    """
    print "I will now run your code on one CPU"
    before = resource.getrusage(resource.RUSAGE_CHILDREN);
    sp = subprocess.Popen(["taskset", "-c", "1", exe, str(code)], stdout=subprocess.PIPE)
    output = sp.communicate()[0]
    after = resource.getrusage(resource.RUSAGE_CHILDREN);

    if not check_one_run(sp, output):
        return False

    cputimeused = after.ru_utime - before.ru_utime
    print "Your program used %f seconds of CPU time when run on one CPU." % (cputimeused)
    if cputimeused > 0.1:
        print "It should not need more than a small fraction of a second."
        print "Check that your program is not busy-waiting."
        return False
    else:
        print "Good."
        return True

if not run_on_one_cpu():
    print "This will result in substantial deductions."
    print "Run with -f to continue anyway."
    if not force:
        sys.exit(0)

successes = 0
cpus = [4, 8, 10, 20, 2]
for i in range(NTEST):
    print ".",
    sys.stdout.flush()
    try:
        if run_one(cpus[i%len(cpus)]):
            successes += 1
    except TimeoutError:
        print >> sys.stderr, "Time-out"

print "done"

if successes == NTEST:
    print "Congrats, your code ran successfully %d out of %d times." % (successes, NTEST)
    sys.exit()

print "Your code ran successfully only %d out of %d times." % (successes, NTEST)
if grade:
  sys.exit()
print "Compiling debug version..."
compile_cmd = "gcc -I%s -pthread -std=gnu11 -g -Wall -Werror %s %s -o %s" % (ex_dir, sol_cfile, driver_cfile, debug_exe)

if os.system(compile_cmd):
    raise Exception("Compile failed, run\n\n%s\n\nto see why" % compile_cmd)

if not os.access(debug_exe, os.X_OK):
    raise Exception(debug_exe + " did not build")

print "Ok."
print "Checking for race conditions using helgrind"

cmd = helgrind + [debug_exe, str(code)]
print "Running", " ".join(cmd), "...",
sp = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
stderr = sp.communicate()[1]
if not re.search("ERROR SUMMARY: 0 errors from 0 contexts", stderr):
    raise Exception("Your program contains race conditions:\n" + stderr)

