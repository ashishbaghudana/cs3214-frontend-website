"""
Scripts to setup the frontend website for each semester
"""
import os
import re

SEMESTER = "fall2018"
SEMESTER_LONG = "Fall 2018"
EXCLUDE_LIST = [
    "./node-app/src/exercises/exercise_files/ex3/checkoutfoxed.py",
    "./node-app/src/exercises/exercise_files/ex3/outfoxed.h",
    "./node-app/src/exercises/exercise_files/ex3/outfoxed-driver.c",
]


def change_semester_in_files(semester, semester_long):
    for root, dirs, files in os.walk("."):
        for file_name in files:
            file = os.path.join(root, file_name)
            # if file in EXCLUDE_LIST:
            #     continue
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
