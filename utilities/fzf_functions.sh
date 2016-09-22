#! /bin/bash

# fe [FUZZY PATTERN] - Open the selected file with the default editor
#   - Bypass fuzzy finder if there's only one match (--select-1)
#   - Exit if there's no match (--exit-0)
fe() {
    IFS='
    '
      local declare files=($(fzf --query="$1" --select-1 --exit-0))
        [[ -n "$files" ]] && ${EDITOR:-nvim} "${files[@]}"
          unset IFS
}

# fkill - Kill process
fkill() {
  pid=$(ps -ef | sed 1d | fzf -m | awk '{print $2}')
  if [ "x$pid" != "x" ]
  then
  kill -${1:-9} $pid
  fi
}

