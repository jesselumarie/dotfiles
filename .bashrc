# set up ruby
eval "$(rbenv init -)"

# set up python
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"
export PYENV_VIRTUALENV_DISABLE_PROMPT=0

# set up node
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

export PATH="/usr/local/sbin:$PATH"
export PATH=$PATH:/usr/local/go/bin
export GOPATH=$HOME/Github/go
export PATH=$PATH:$GOPATH/bin
export PATH="$PATH:/Applications/Visual Studio Code.app/Contents/Resources/app/bin"
export LOG_FORMAT=colored
export FZF_DEFAULT_OPTS='
  --color=bg+:24
'
export FZF_CTRL_T__OPTS='
  --color=bg+:24
'
export FZF_DEFAULT_COMMAND='find .'
export FZF_CTRL_T_COMMAND='find .'

function parse_git_branch {
 git branch --no-color 2> /dev/null | sed -e '/^[^​*]/d' -e 's/*​ \(.*\)/\1/'
}

function v {
  vim $(fzf)
}

function o {
  open $(fzf)
}


PS1="⚡️ \[\033[0;35m\][\W]\[\033[0;33m\][\$(parse_git_branch)]\[\033[0;36m\]> \[\033[0;39m\]"

export NVM_DIR=~/.nvm

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
alias gh='cd ~/repos'
alias repos='cd ~/repos'
alias fa='cd ~/repos/bricklane_repos/fundadmin'
alias bl='cd ~/repos/bricklane_repos/bricklane'
alias dot='cd ~/dotfiles'
alias dsync='sh ~/dotfiles/sync.sh; source ~/.bashrc'
alias f='fzf'
alias vim='/usr/local/bin/vim'

[ -f  ~/dotfiles/.bashrc.private ] && source ~/dotfiles/.bashrc.private

[ -f ~/.fzf.bash ] && source ~/.fzf.bash

source ~/dotfiles/utilities/fzf_functions.sh
source ~/dotfiles/utilities/git-completion.bash

