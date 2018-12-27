# CS3214 - Frontend Website Configuration

This repository contains setup scripts for CS3214 website. The website is built using AngularJS and is a static website. Configuration changes to the website are done via a JSON file. Projects and exercises can be enabled or disabled via the static configuration. Redeployment of the website is required every time the configuration changes.

## Pre-requisites and Semester Setup

Use the Python script `setup_semester.py` to setup files for each semester. The script does a recursive grep for any pattern that matches `(spring|fall)\d+` and `(Spring |Fall )\d+` and replaces that with the current semester.

### Node Virtual Manager

We use nvm to manage npm and nodejs installations. The website is tested with node v11.4.0 and npm v6.4.1.

```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | bash
nvm --version
nvm install node
```

### Semester Setup

The web application is configured using a JSON file that is placed within the directory `/home/courses/cs3214/admin/submissions/configurationFiles`. There are several fields in configuration file, including the semester name, TAs, lectures, and other documents. See the `config/` folder for more information.

## Node Application Setup

Setting up the application is straightforward. Navigate to the `node-app/` folder and use npm to install dependencies and run webpack.

```
cd node-app
npm install
npm run build
./publish.sh
```
