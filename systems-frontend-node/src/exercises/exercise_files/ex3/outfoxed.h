/*
 * The game "OutFoxed" by GameWright (http://bit.ly/1QWKDzD)
 * is a cooperative deduction style game for children 5 years or older.
 *
 * In the game, a thief stole Mrs. Plumpert's prized pot pie and 4 chicken detectives 
 * must crack the case.  They do this by gathering clues that can eliminate suspects.
 * Each suspect owns 3 clues.  For instance, suspect 'Mary' wears a
 * flower, a scarf, and carries a briefcase.
 *
 * For each round of play, the thief is chosen by drawing a random card face down 
 * and placing it into a plastic decoder device onto which clues are placed.
 * The name of thief is not visible when the thief card is placed in the decoder.
 * When a clue is placed onto the decoder and the decoder is opened, it will reveal 
 * a color for this clue (red or green).  Players will see only this color and
 * must deduce which suspect(s) could match the clue.
 */
enum ClueColor { 
    RED,    /* If the clue is red, then the thief must own that clue. */
    GREEN   /* If the clue is green, then the thief must not own that clue. */
};

/* There is a total of 12 clues. */
#define NUMBER_OF_CLUES 12

/*
 * They are listed below.
 */
enum Clue {
    hat, umbrella, glasses, monocle, flower, coat,
    cane, gloves, watch, necklace, briefcase, scarf
};

/* There are 16 suspects. */
#define NUMBER_OF_SUSPECTS 16

/* Each suspect has a name and a number and owns three clues. */
typedef struct {
    int number;             // number of suspect: 0 .. 15
    const char *name;       // suspect's name, e.g. "Mary", "Harold", ....
    enum Clue clues[3];     // clues owned by suspect
} Suspect;

/* All suspects are stored in this global array, so you can refer
 * to them by a pointer. */
extern const Suspect suspects [NUMBER_OF_SUSPECTS];

/*
 * Initially, the names of the suspects are not known.  (Their cards
 * lie face down on the table.)
 *
 * In the game, the chicken detectives roll 3 dice to decide
 * whether a clue is revealed or a suspect card is turned over.
 * (There is also a third option: the thief moves one step closer 
 * to the safety of the fox hole. But we ignore this in this exercise.)
 *
 * Instead of rolling dice, the chicken detectives, the suspects, and the 
 * clues are represented as concurrent threads your program will implement.
 */

/* (1) Chicken detectives.  There are 4 of them. */
#define NUMBER_OF_DETECTIVES 4

/* Each detective thread will execute the chicken_detective_thread 
 * function, which you must implement.  A detective thread must return
 * when the suspect has been found.
 */
extern void * chicken_detective_thread(void *);

/* Call this function to eliminate a suspect.
 * Of course, only chicken detectives can call this function. */
extern void eliminate_suspect(const Suspect *s);

/* Call this function to announce the thief.
 *
 * Likewise, only chicken detectives can call this function. 
 * You must have eliminated all but one suspect before you announce
 * the thief. */
extern void announce_thief(const Suspect *s);

/* (2) Suspects.  Whenever a new suspect card is turned over, a new thread
 * will be created and starts executing the function 'new_suspect_thread,'
 * which you must implement.  The void * argument points to the suspect
 * that was revealed.  Suspects may appear in random order!
 *
 * Suspect (thread)s must return before the game can end.
 */
extern void * new_suspect_thread(void * suspect);

/* (3) Clues. Each clue shows up in a separate thread.
 * You must implement the 12 functions below such that 
 *
 * (a) Each clue is decoded by the clue thread responsible for it.
 * (b) The clues are decoded in exactly the order prescribed by your 
 *     personal code, which is listed on the website.
 *
 * Clue (thread)s must also return before the game can end.
 */
extern void * hat_thread(void *);
extern void * umbrella_thread(void *);
extern void * glasses_thread(void *);
extern void * monocle_thread(void *);
extern void * flower_thread(void *);
extern void * coat_thread(void *);
extern void * cane_thread(void *);
extern void * gloves_thread(void *);
extern void * watch_thread(void *);
extern void * necklace_thread(void *);
extern void * briefcase_thread(void *);
extern void * scarf_thread(void *);

/* Clue threads call this function to decode a clue. 
 *
 * Only the thread responsible for that clue can
 * decode it, i.e., only the flower_thread can decode the clue 'flower'
 */
extern enum ClueColor decode_clue(enum Clue clue);

/* To give you a chance to (re-)initialize any data structures you may need,
 * we will call setup_play() every time a new game starts.
 * Thus, setup_play() may be called multiple times during one program run. 
 */
extern void setup_play(void);

/* Call this function to prints the name of a clue. */
extern const char * clue_name(const enum Clue clue);

/*
 * Write your code in a program 'outfoxed.c', then build your program like so:
 *
 * gcc -pthread -std=gnu11 -O2 -Wall outfoxed.c outfoxed-driver.c -o outfoxed
 */

/*
 * Created by Godmar Back <gback@cs.vt.edu> for CS 3214 Spring 2016.
 */
