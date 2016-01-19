eval "$(rbenv init -)"
export PATH="/usr/local/sbin:$PATH"
export DOCKER_HOST=tcp://192.168.23.2:2375

function parse_git_branch {
 git branch --no-color 2> /dev/null | sed -e '/^[^​*]/d' -e 's/*​ \(.*\)/\1/'
}

PS1="\[\033[0;35m\][\W]\[\033[0;33m\][\$(parse_git_branch)]\[\033[0;36m\]> \[\033[0;39m\]"

export NVM_DIR=~/.nvm
. $(brew --prefix nvm)/nvm.sh


alias git=hub
alias a='atom'
alias l='ls'
alias gs='git status'
alias be='bundle exec'
alias ber='bundle exec rake'
alias st='script/test'
alias sc='script/console'
alias ss='script/server'
alias sw='script/worker'
alias sd='script/dev'
alias berps='current_dir=$PWD; cd ~/Github/service_manager/; bundle exec rake ps;cd $current_dir'
alias sm='cd ~/Github/service_manager/'
alias gh='cd ~/Github'
