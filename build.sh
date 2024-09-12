#!/bin/bash

# Get the current working directory
root_dir=$(pwd)

# Loop through each subdirectory, one level deep
for dir in */; do
    dir="${dir%/}"
    # Check if the directory contains a package.json file
    if [ -f "${dir}/package.json" ]; then
        echo "Entering directory: ${dir}"
        cd "${dir}" || continue
        npm i;
        # Run 'npm run package' if package.json exists
        if npm run package --icon=${root_dir}/${dir}/${dir}.svg ${dir}; then
            echo "'npm run package' completed successfully in ${dir}"
        else
            echo "'npm run package' failed in ${dir}"
        fi
        # Return to the root directory
        cd "${root_dir}";
        node postpackage.js "${dir}" || exit
    else
        echo "No package.json found in ${dir}, skipping..."
    fi
done
