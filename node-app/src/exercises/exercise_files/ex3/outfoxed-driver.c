/**
 * Test driver for outfoxed program.
 *
 * You may read this code, but not change it. 
 * For grading, we will use exactly this copy.
 *
 * Written by Godmar Back <gback@cs.vt.edu> for CS 3214
 * Spring 2018
 */
#include "outfoxed.h"

#define _GNU_SOURCE

#include <pthread.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>
#include <time.h>
#include <sys/time.h>
#include <assert.h>
#include <sched.h>

#define N_GAMES 50

static void * (* clue_thread_functions[NUMBER_OF_CLUES]) (void *) = {
    hat_thread,
    umbrella_thread,
    glasses_thread,
    monocle_thread,
    flower_thread,
    coat_thread,
    cane_thread,
    gloves_thread,
    watch_thread,
    necklace_thread,
    briefcase_thread,
    scarf_thread
};

#define DEF_SUSPECT(nr, suspect, ...) \
    { .number = nr, .name = #suspect, .clues = { __VA_ARGS__ } }

const Suspect suspects [NUMBER_OF_SUSPECTS] =
{
    DEF_SUSPECT(0 , Belle    , cane, monocle, flower),
    DEF_SUSPECT(1 , Mary     , briefcase, flower, scarf),
    DEF_SUSPECT(2 , Gertrude , necklace, flower, cane),
    DEF_SUSPECT(3 , Arthur   , hat, scarf, briefcase),
    DEF_SUSPECT(4 , Charles  , flower, glasses, watch),
    DEF_SUSPECT(5 , Beatrice , umbrella, scarf, gloves),
    DEF_SUSPECT(6 , Alice    , coat, necklace, watch),
    DEF_SUSPECT(7 , Daisy    , cane, necklace, coat),
    DEF_SUSPECT(8 , Lily     , umbrella, gloves, necklace),
    DEF_SUSPECT(9 , Belvedere, watch, monocle, hat),
    DEF_SUSPECT(10, Harold   , glasses, briefcase, coat),
    DEF_SUSPECT(11, Riley    , hat, watch, scarf),
    DEF_SUSPECT(12, Henry    , hat, glasses, cane),
    DEF_SUSPECT(13, Edith    , briefcase, monocle, coat),
    DEF_SUSPECT(14, Maggie   , umbrella, monocle, gloves),
    DEF_SUSPECT(15, Ingrid   , umbrella, gloves, glasses)
};

static const char * clue_names[] = {
    "hat", "umbrella", "glasses", "monocle", "flower", "coat",
    "cane", "gloves", "watch", "necklace", "briefcase", "scarf"
};

const char *
clue_name(const enum Clue clue)
{
    assert (clue < NUMBER_OF_CLUES);
    return clue_names[clue];
}

static bool verbose;
static pthread_t chicken_detective[NUMBER_OF_DETECTIVES];
static int chicken_detective_ops[NUMBER_OF_DETECTIVES];
static const Suspect * thief;
static int next_expected_clue;
static bool thief_correctly_announced;
static int remaining_suspects;
static int clue_order[NUMBER_OF_CLUES];
static pthread_mutex_t clue_thread_lock = PTHREAD_MUTEX_INITIALIZER;
static pthread_t clue_threads[NUMBER_OF_CLUES];
static int suspects_started;
static int no_share_count;

static void
decode_game_plan(uint64_t plan)
{
    printf("For gamecode %lu, the clues must be announced in this order:\n", plan);
    for (int i = 0; i < NUMBER_OF_CLUES; i++) {
        int clueidx = (plan >> (i) * 4) & 0xf;
        clue_order[NUMBER_OF_CLUES - 1 - i] = clueidx;
    }

    for (int i = 0; i < NUMBER_OF_CLUES; i++) {
        printf(" %s", clue_names[clue_order[i]]);
    }

    printf("\n");
}

static int
get_affinity()
{
    cpu_set_t my_set;
    CPU_ZERO(&my_set);

    if (sched_getaffinity(0, sizeof(my_set), &my_set) < 0) {
        perror("sched_getaffinity");
    }
    int count = 0;
    for (int j = 0; j < CPU_SETSIZE; ++j) {
        if (CPU_ISSET(j, &my_set)) {
            ++count;
        }
    }
    return count;
}

static void
check_valid_call(const Suspect *s, const char *msg)
{
    if (!(suspects <= s && s < suspects + NUMBER_OF_SUSPECTS)) {
        printf("%p is not a valid suspect.!\n", s);
        abort();
    } 

    for (int i = 0; i < NUMBER_OF_DETECTIVES; i++) {
        if (pthread_self() == chicken_detective[i]) {
            chicken_detective_ops[i]++;
            return;
        }
    }

    printf("%s", msg);
    abort();
}

void
eliminate_suspect(const Suspect *s)
{
    check_valid_call(s, "eliminate_suspect: Only chicken detectives can eliminate suspects!\n");
    int sindex = s - suspects;
    if (!(remaining_suspects & (1<<sindex))) {
        printf("A detective is trying to eliminate suspect %s who was already eliminated!\n", s->name);
        abort();
    }

    remaining_suspects &= ~(1<<sindex);
    if (remaining_suspects == 0) {
        printf("%s: The chicken detectives have eliminated all suspects but have not announced a thief.\n", __func__);
        abort();
    }

    if (!(suspects_started & (1 << sindex))) {
        printf("%s: Only suspects that have been revealed can be eliminated.\n",
            __func__);
        abort();
    }

    if (verbose) {
        printf("A chicken detective has eliminated %s as a suspect.\n", s->name);
    }
}

void
announce_thief(const Suspect *s)
{
    check_valid_call(s, "announce_thief: Only chicken detectives can announce the thief!\n");
    int nremaining = __builtin_popcount(remaining_suspects);
    if (nremaining != 1) {
        printf("%s: Your chicken detective is announcing a thief but there are %d suspects left.\n"
               "It should announce the thief if there's exactly 1 suspect left.\n", __func__, nremaining);
        abort();
    }

    if (s != thief) {
        printf("%s: A chicken detective is announcing that %s is the thief, but it's really %s\n",
            __func__, s->name, thief->name);
        abort();
    }

    if (thief_correctly_announced) {
        printf("%s: The thief has already been announced. Only the first detective to catch the thief should announce it!\n", __func__);
        abort();
    }

    printf("A chicken detective has caught the thief!  It was: %s\n", s->name);
    thief_correctly_announced = true;
}

static void
start_thread(pthread_t * pt, void * (*f)(void *), void *arg) 
{
    int rc = pthread_create(pt, (const pthread_attr_t *) NULL, f, arg);
    if (rc != 0) {
        perror("pthread_create");
        exit(-1);
    }
}

static void
play_one(void)
{
    setup_play();

    thief_correctly_announced = false;
    thief = &suspects[random() % NUMBER_OF_SUSPECTS];

    next_expected_clue = 0;
    remaining_suspects = (1 << NUMBER_OF_SUSPECTS) - 1;
    pthread_t suspect_threads[NUMBER_OF_SUSPECTS];

    pthread_mutex_lock(&clue_thread_lock);
    // Wipe clue_threads in case pthread_t are being reused
    memset(clue_threads, 0, sizeof(clue_threads));
    pthread_mutex_unlock(&clue_thread_lock);

    if (verbose) {
        printf("Pssst! Don't tell anyone that %s is the thief.\n", thief->name);
    }

    // Produce somewhat random game play by letting the chicken detective,
    // the suspects, and the clues start in random order
    int detective_no = 0;
    int clues_started = 0;
    suspects_started = 0;
    for (int i = 0; i < NUMBER_OF_DETECTIVES; i++) {
        chicken_detective_ops[i] = 0;
    }
    int i;
    while (detective_no < NUMBER_OF_DETECTIVES
            || suspects_started != (1 << NUMBER_OF_SUSPECTS) - 1
            || clues_started != (1 << NUMBER_OF_CLUES) - 1) 
    {
        switch (random() % 3) {
        case 0:
            // Start a detective thread
            if (detective_no == NUMBER_OF_DETECTIVES) {
                break;
            }

            if (verbose) {
                printf("Starting chicken detective #%d\n", detective_no + 1);
            }

            start_thread(chicken_detective+detective_no, chicken_detective_thread, NULL);
            detective_no++;
            break;

        case 1:
            // Reveal a clue
            if (clues_started == (1 << NUMBER_OF_CLUES) - 1) {
                break;
            }

            i = random() % NUMBER_OF_CLUES;
            while (clues_started & (1 << i)) {
                i = random() % NUMBER_OF_CLUES;
            }
            
            clues_started |= 1 << i;
            pthread_mutex_lock(&clue_thread_lock);
            start_thread(clue_threads + i, clue_thread_functions[i], NULL);
            pthread_mutex_unlock(&clue_thread_lock);
            break;

        case 2:
            // Reveal a suspect
            if (suspects_started == (1 << NUMBER_OF_SUSPECTS) - 1) {
                break;
            }

            i = random() % NUMBER_OF_SUSPECTS;
            while (suspects_started & (1 << i)) {
                i = random() % NUMBER_OF_SUSPECTS;
            }
            
            // The gcc builtin below is an atomic version of suspects_started |= 1 << i
            __sync_fetch_and_or(&suspects_started, 1 << i);
            if (verbose) {
                printf("Uncovering suspect %s\n", suspects[i].name);
            }
            start_thread(suspect_threads + i, new_suspect_thread, (void *) &suspects[i]);
            break;
        }
    }

    if (verbose) {
        printf("The chicken detectives, the clues, and the suspects were released. Now waiting for them to come home.\n");
    }

    for (int i = 0; i < NUMBER_OF_SUSPECTS; i++) {
        pthread_join(suspect_threads[i], NULL);
    }

    for (int i = 0; i < NUMBER_OF_CLUES; i++) {
        pthread_join(clue_threads[i], NULL);
    }

    for (int i = 0; i < NUMBER_OF_DETECTIVES; i++) {
        pthread_join(chicken_detective[i], NULL);
        if (get_affinity() != 1 &&
                chicken_detective_ops[i] == NUMBER_OF_SUSPECTS) {
            no_share_count++;
        }
    }

    if (!thief_correctly_announced) {
        printf("Your chicken did not catch the thief!\n");
        abort();
    }

    if (verbose) {
        printf("Game complete.\n");
    }
}

int
main(int ac, char *av[])
{
    char * v = getenv("VERBOSE");
    verbose = v && !strcmp(v, "1");

    if (ac < 2) {
        fprintf(stderr, "Missing unique game code!\n");
        exit(EXIT_FAILURE);
    }
    assert(sizeof(uint64_t) == sizeof(unsigned long));
    uint64_t plan = strtoul(av[1], NULL, 10);
    decode_game_plan(plan);

    struct timeval t1;
    gettimeofday(&t1, NULL);
    srand(t1.tv_usec * t1.tv_sec);

    if (verbose) {
        play_one();

    } else {
        for (int i = 0; i < N_GAMES; i++) {
            play_one();
        }
        if (no_share_count == N_GAMES) {
            printf("Chicken detectives are not sharing work\n");
            abort();
        }
    }

    return 0;
}

static int
find_thread_index(pthread_t t)
{
    int rc = -1;
    pthread_mutex_lock(&clue_thread_lock);
    for (int i = 0; i < NUMBER_OF_CLUES; i++) {
        if (clue_threads[i] == t) {
            rc = i;
            break;
        }
    }
    pthread_mutex_unlock(&clue_thread_lock);
    return rc;
}

enum ClueColor
decode_clue(enum Clue clue)
{
    if (clue >= NUMBER_OF_CLUES) {
        printf("%s: invalid clue number %d\n", __func__, clue);
        abort();
    }

    int tid = find_thread_index(pthread_self());

    if (clue != tid) {
        printf("%s: %s_thread tries to decode clue %s.\n", __func__, clue_names[tid], clue_names[clue]);
        printf("but only %s_thread can decode clue %s\n", clue_names[clue], clue_names[clue]);
        abort();
    }
    if (clue_order[next_expected_clue] != clue) {
        printf("%s: %s_thread decoded clue %s.\n", __func__, clue_names[tid], clue_names[clue]);
        printf("but your program must decode clue %s next!\n", clue_names[clue_order[next_expected_clue]]);
        abort();
    }
    if (thief_correctly_announced) {
        printf("%s: Since the detectives have already announced the thief, you must not uncover any more clues.\n", __func__);
        abort();
    }

    if (verbose) {
        printf("You have decoded clue %s\n", clue_name(clue));
    }

    next_expected_clue++;

    for (int i = 0; i < 3; i++) {
        if (thief->clues[i] == clue) {
            return RED;
        }
    }
    return GREEN;
}
