"""
Scripts to setup the frontend website for each semester
"""
import os
import re

SEMESTER = "spring2019"
SEMESTER_LONG = "Spring 2019"
EXCLUDE_LIST = [
    "./node-app/src/exercises/exercise_files/ex3/checkoutfoxed.py",
    "./node-app/src/exercises/exercise_files/ex3/outfoxed.h",
    "./node-app/src/exercises/exercise_files/ex3/outfoxed-driver.c",
    "./node-app/src/app/grouper/grouper.html",
    "./node-app/src/projects/project1.html",
    "./node-app/src/projects/project2.html",
    "./node-app/src/projects/project4.html",
    "./node-app/SEMESTER_SETUP.md",
    "./setup_semester.py"
]


def change_semester_in_files(semester, semester_long):
    for root, dirs, files in os.walk("."):
        for file_name in files:
            file = os.path.join(root, file_name)
            if file in EXCLUDE_LIST:
                continue
            try:
                with open(file) as freader:
                    content = freader.read()
                result = re.sub(r'(spring|fall)\d+', semester, content)
                result = re.sub(r'(Spring |Fall )\d+', semester_long, result)
                if result != content:
                    with open(file, 'w') as fwriter:
                        fwriter.write(result)
            except UnicodeDecodeError as e:
                continue


if __name__ == '__main__':
    change_semester_in_files(semester=SEMESTER, semester_long=SEMESTER_LONG)
