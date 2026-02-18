diffs() {
  # Check for the correct number of arguments
  if [ "$#" -ne 2 ]; then
    echo "Usage: diffs 'str1' 'str2'"
    return 1
  fi

  # Assign the input strings to variables
  local str1="$1"
  local str2="$2"

  # Create temporary files to store the strings
  local tmp1="$(mktemp)"
  local tmp2="$(mktemp)"

  # Write the strings to the temporary files
  echo "$str1" > "$tmp1"
  echo "$str2" > "$tmp2"

  echo "\n"

  # Run the wdiff command with the --avoid-wraps and --terminal options
  git diff --word-diff=color --word-diff-regex=. "$tmp1" "$tmp2" | awk 'NR>5 {print}'

  # Clean up the temporary files
  rm -f "$tmp1" "$tmp2"
}

# Register the function for autoloading
autoload -Uz diffs
