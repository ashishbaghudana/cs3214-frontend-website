import exercises_html from '../exercises/exercises.html'
import ex1_html from '../exercises/exercise1.html'
import ex2_html from '../exercises/exercise2.html'
import ex3_html from '../exercises/exercise3.html'
import ex4_html from '../exercises/exercise4.html'



let exercise_config = {
    nav_targets: {
        topbar: [],
        dropdowns: [
            {
                label: "Exercises",
                entries: [
                    {path: '/exercises', label: "Exercise Due Dates", templateUrl: exercises_html},
                    {path: '/ex1', label: "Exercise 1", templateUrl: ex1_html, needauthentication: true, disabled: true},
                    {path: '/ex2', label: "Exercise 2", templateUrl: ex2_html, disabled: true},
                    {path: '/ex3', label: "Exercise 3", templateUrl: ex3_html, needauthentication: true, disabled: true},
                    {path: '/ex4', label: "Exercise 4", templateUrl: ex4_html, disabled: true},
                ]
            },
        ]
    }
};

export default exercise_config
