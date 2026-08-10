#include <vector>
#include <cmath>
#include <emscripten/emscripten.h>

class NoiseCanceller {
private:
    float threshold;
    float attack;
    float release;
    float envelope;
    int sampleRate;

public:
    NoiseCanceller(int sampleRate, float threshold_db = -45.0f) 
        : sampleRate(sampleRate), envelope(0.0f) {
        this->threshold = std::pow(10.0f, threshold_db / 20.0f);
        // Attack/release times in milliseconds
        this->attack = std::exp(-1.0f / (sampleRate * 0.005f)); // 5ms for quick attack
        this->release = std::exp(-1.0f / (sampleRate * 0.15f)); // 150ms for smooth release
    }

    void setThreshold(float threshold_db) {
        this->threshold = std::pow(10.0f, threshold_db / 20.0f);
    }

    void process(float* input, float* output, int numSamples) {
        for (int i = 0; i < numSamples; ++i) {
            float sample = input[i];
            float absSample = std::abs(sample);

            // Envelope follower for continuous tracking
            if (absSample > envelope) {
                envelope = attack * (envelope - absSample) + absSample;
            } else {
                envelope = release * (envelope - absSample) + absSample;
            }

            // Apply noise gate with a soft knee smooth transition
            float gain = 1.0f;
            if (envelope < threshold) {
                // Smooth fade minimizing audio artifacts (clicks)
                float ratio = envelope / threshold;
                // Use a non-linear curve for softer gating
                gain = ratio * ratio; 
            }

            output[i] = sample * gain;
        }
    }
};

extern "C" {
    EMSCRIPTEN_KEEPALIVE
    NoiseCanceller* createCanceller(int sampleRate) {
        return new NoiseCanceller(sampleRate);
    }

    EMSCRIPTEN_KEEPALIVE
    void setThreshold(NoiseCanceller* canceller, float threshold_db) {
        if(canceller) {
            canceller->setThreshold(threshold_db);
        }
    }

    EMSCRIPTEN_KEEPALIVE
    void processAudio(NoiseCanceller* canceller, float* input, float* output, int numSamples) {
        if (canceller) {
            canceller->process(input, output, numSamples);
        }
    }

    EMSCRIPTEN_KEEPALIVE
    void destroyCanceller(NoiseCanceller* canceller) {
        if (canceller) {
            delete canceller;
        }
    }
}
