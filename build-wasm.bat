@echo off
echo Compiling C++ Audio Noise Canceller to WebAssembly...

mkdir src\renderer\src\lib\audio 2>nul || ver > nul

emcc src/cpp/NoiseCanceller.cpp -O3 ^
    -s WASM=1 ^
    -s EXPORTED_RUNTIME_METHODS="['ccall','cwrap','getValue','setValue']" ^
    -s EXPORT_ES6=1 ^
    -s MODULARIZE=1 ^
    -s SINGLE_FILE=1 ^
    -o src/renderer/src/lib/audio/noise-canceller-wasm.js

echo Done! The WASM module is now inside src/renderer/src/lib/audio/noise-canceller-wasm.js
