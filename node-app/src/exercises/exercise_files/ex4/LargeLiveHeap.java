/*
 * Program that produces classic ramp for live memory
 * with linear allocation rate.
 */
public class LargeLiveHeap
{
    public static void main(String []av) {
        int numLive = 100;
        int numAllocations = 10000;

        HeapTracker.startTrace();
        byte[][] array = new byte[100][];
        HeapTracker.takeLiveHeapSample();
        for (int i = 0; i < 10000; i++) {
            array[i % array.length] = new byte[100000];
            HeapTracker.takeLiveHeapSample();
        }

        HeapTracker.stopTrace();
    }
}
