/**
 * Echo Canceller AudioWorklet for TrueHire interview system
 * Implements echo cancellation to prevent feedback in interview audio recording
 */

class EchoCancellerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // Buffer to store previous audio samples for echo detection
    this.bufferSize = 2048;
    this.delayBuffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    
    // Echo cancellation parameters
    this.echoThreshold = 0.1;     // Threshold for echo detection
    this.suppressionFactor = 0.7; // Echo suppression strength
    
    // Noise reduction parameters
    this.noiseFloor = 0.01;       // Noise detection level
    this.noiseReduction = 0.5;    // Noise suppression strength
    
    console.log('Echo canceller processor initialized');
  }

  process(inputs, outputs, parameters) {
    // Get input and output channels
    const input = inputs[0];
    const output = outputs[0];
    
    // If no input, passthrough silence
    if (!input || !input.length) {
      return true;
    }
    
    // Process each channel
    for (let channelIndex = 0; channelIndex < input.length; channelIndex++) {
      const inputChannel = input[channelIndex];
      const outputChannel = output[channelIndex];
      
      if (!inputChannel || !outputChannel) continue;
      
      // Process each sample in the channel
      for (let i = 0; i < inputChannel.length; i++) {
        // Get the current sample
        const currentSample = inputChannel[i];
        
        // Check the delay buffer for echo
        const delayedIndex = (this.bufferIndex + i) % this.bufferSize;
        const delayedSample = this.delayBuffer[delayedIndex];
        
        // Echo cancellation
        let processedSample = currentSample;
        
        // If we detect an echo (similar amplitude to a delayed sample)
        if (Math.abs(currentSample - delayedSample) < this.echoThreshold && 
            Math.abs(currentSample) > this.noiseFloor) {
          // Apply echo suppression
          processedSample = currentSample * (1 - this.suppressionFactor);
        }
        
        // Noise gate - reduce samples below the noise floor
        if (Math.abs(processedSample) < this.noiseFloor) {
          processedSample *= this.noiseReduction;
        }
        
        // Store the processed sample in the output
        outputChannel[i] = processedSample;
        
        // Store the current sample in the delay buffer for future comparison
        this.delayBuffer[(this.bufferIndex + inputChannel.length + i) % this.bufferSize] = currentSample;
      }
    }
    
    // Update buffer index
    this.bufferIndex = (this.bufferIndex + input[0].length) % this.bufferSize;
    
    // Return true to keep the processor running
    return true;
  }
}

// Register the processor
registerProcessor('echo-canceller', EchoCancellerProcessor);
