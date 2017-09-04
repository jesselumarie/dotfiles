export PATH="~/.pyenv/bin:$PATH"
eval "$(rbenv init -)"
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"
export PATH="/usr/local/sbin:$PATH"
export PATH=$PATH:/usr/local/go/bin
export GOPATH=$HOME/Github/go
export PATH=$PATH:$GOPATH/bin
export LOG_FORMAT=colored

function parse_git_branch {
 git branch --no-color 2> /dev/null | sed -e '/^[^​*]/d' -e 's/*​ \(.*\)/\1/'
}

function start {
  current_dir=$PWD;
  cd ~/Github/service_manager;
  script/start "$1";
  cd $current_dir;
}

function v {
  vim $(fzf)
}

function o {
  open $(fzf)
}

source ~/.git-completion.bash

PS1="⚡️ \[\033[0;35m\][\W]\[\033[0;33m\][\$(parse_git_branch)]\[\033[0;36m\]> \[\033[0;39m\]"

export NVM_DIR=~/.nvm

export -f start

alias git=hub
alias a='atom'
alias l='ls'
alias gs='git status'
alias gp='git pull'
alias gd='git diff'
alias gco='git checkout'
alias be='bundle exec'
alias ber='bundle exec rake'
alias st='script/test'
alias sc='script/console'
alias ss='script/server'
alias sw='script/worker'
alias sd='script/dev'
alias sb='script/build'
alias dps='current_dir=$PWD; cd ~/Github/service_manager/; script/ps; cd $current_dir'
alias sm='cd ~/Github/service_manager/'
alias gh='cd ~/Github'
alias tsh="~/dotfiles/utilities/tsh.sh"
alias dot='cd ~/dotfiles'
alias dsync='sh ~/dotfiles/sync.sh'
alias rmrf='mv node_modules __node_modules && rm -rf __node_modules &'
alias f='fzf'
alias vim='/usr/local/bin/vim'

. ~/dotfiles/.bashrc.private

[ -f ~/.fzf.bash ] && source ~/.fzf.bash

source ~/dotfiles/utilities/fzf_functions.sh
PATH=$PATH:/Users/jessefurmanek/Github/devtools/bin
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
