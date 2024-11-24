#! /bin/bash
clang --target=wasm32 -emit-llvm -c -S example.c
llc -march=wasm32 -filetype=obj example.ll
wasm-ld --no-entry --export-all --import-memory -o example.wasm example.o
