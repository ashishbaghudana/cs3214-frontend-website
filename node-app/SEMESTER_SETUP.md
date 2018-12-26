# Configuring the Frontend for a new Semester
This file will detail how to configure the frontend for another semester in CS3214.

## Configure the api urls
The urls are not semester specific right now as the CAS url needs javascript.

Change the `judgeapiurl` and the `apiurl` urls to point to the new semester.
These are found in src/config/config.js

## Create a new semester config file 
ex. /home/courses/cs3214/admin/submissions/configurationFiles/fall2018.json

This file will serve as the custom configuration for all of the semester specific configuration.

## Populate the fields in the configuration file

Some fields of interest are:

| Field                  | Description                                                                                  |
|------------------------|----------------------------------------------------------------------------------------------|
| BASEPATH               | Path that all student submissions will be stored (do something in ~cs3214/admin/submissions) |
| EXAM_CSV_FILE_TEMPLATE | Use once midterms and finals are released                                                    |
| ADMINS                 | The current admins                                                                           |
| projecttargets         | The submission points and due dates for exercises/projects                                   |
| semester               | The semester displayed                                                                       |
| syllabus               | Path to syllabus                                                                             |
| Lectures               | The lectures displayed on the lectures page.                                                 |

## Configure the backend
See Readme.semester.md in the autograder-queue repository for details.