# set up ruby
# export PATH="$HOME/.rbenv/bin:$PATH"
# export PATH="$HOME/.rbenv/shims:$PATH"
# eval "$(rbenv init -)"

# Ensure user-installed binaries take precedence
export PATH=/usr/local/bin:$PATH

# Set up  brew
export PATH="/usr/local/sbin:$PATH"


# set up python
export WORKON_HOME=$HOME/.virtualenvs
export PROJECT_HOME=$HOME/repos
source /usr/local/bin/virtualenvwrapper.sh
# export PIP_REQUIRE_VIRTUALENV=true
export PATH="$PATH:/Applications/Visual Studio Code.app/Contents/Resources/app/bin"

# global-pip() {
#   PIP_REQUIRE_VIRTUALENV="" pip "$@"
# }

# set up node
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

export PATH=$PATH:/usr/local/go/bin

export GOPATH=$HOME/Github/go
export PATH=$PATH:$GOPATH/bin
export LOG_FORMAT=colored
export FZF_DEFAULT_OPTS='
  --color=bg+:24
'
export FZF_CTRL_T__OPTS='
  --color=bg+:24
'
export FZF_DEFAULT_COMMAND='ag -g . '
export FZF_CTRL_T_COMMAND='ag -g . '

function parse_git_branch {
 git branch --no-color 2> /dev/null | sed -e '/^[^​*]/d' -e 's/*​ \(.*\)/\1/'
}

function vs {
  vim $(fzf)
}

function o {
  open $(fzf)
}

function virtualenv_info(){
    # Get Virtual Env
    if [[ -n "$VIRTUAL_ENV" ]]; then
        # Strip out the path and just leave the env name
        venv="${VIRTUAL_ENV##*/}"
    else
        # In case you dont have one activated
        venv=''
    fi
    [[ -n "$venv" ]] && echo "($venv)"
}

# disable virtualenv prompt
export VIRTUAL_ENV_DISABLE_PROMPT=0

# create custome prompt when using virtualenv
CUSTOM_VENV_PROMPT="\$(virtualenv_info)";
AVATAR="⚡️"

PS1="$AVATAR(\D{%R})\[\033[0;35m\][\W]\[\033[0;33m\][\$(parse_git_branch)]\[\033[0;36m\]$CUSTOM_VENV_PROMPT>\[\033[0;37m\]\[ \]"

export NVM_DIR=~/.nvm

alias a='atom'
alias l='ls'
alias gs='git status'
alias gp='git pull'
alias gd='git diff'
alias gco='git checkout'
alias gdc='git diff --cached'
alias gcm='git commit -m'
alias gca='git commit --amend --no-edit'
alias be='bundle exec'
alias ber='bundle exec rake'
alias st='script/test'
alias sc='script/console'
alias ss='script/server'
alias sw='script/worker'
alias sd='script/dev'
alias sb='script/build'
alias repos='cd ~/repos'
alias dot='cd ~/dotfiles'
alias dsync='sh ~/dotfiles/sync.sh; source ~/.bashrc'
alias f='fzf | pbcopy'
alias v='vim'
alias vim='/usr/local/bin/vim'
alias vv='cd ~/code/notes/ && /usr/local/bin/vim -c "set syntax=markdown"'
alias rename='~/dotfiles/bin/rename-identifier'
[ -f  ~/dotfiles/.bashrc.private ] && source ~/dotfiles/.bashrc.private

[ -f ~/.fzf.bash ] && source ~/.fzf.bash

source ~/dotfiles/utilities/fzf_functions.sh
source ~/dotfiles/utilities/git-completion.bash

export PATH="$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH"
