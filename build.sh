#! /usr/bin/bash

set -e

declare -a BUILD_TARGETS=("firefox" "chromium")

mkdir -p build

for target in "${BUILD_TARGETS[@]}"; do
    rm -r build/$target
    cp -R src -T build/$target
    BUILD_TARGET=$target pkl eval -f json manifest.pkl > build/$target/manifest.json
done
