# set up ruby
# export PATH="$HOME/.rbenv/bin:$PATH"
# export PATH="$HOME/.rbenv/shims:$PATH"
eval "$(rbenv init - zsh)"
export GEM_HOME=$HOME/.gem
export PATH=$GEM_HOME/bin:$PATH

# Adding git completion script
fpath=(~/.zsh $fpath)
zstyle ':completion:*:*:git:*' script ~/dotfiles/.git-completion.bash
# only look at local files
__git_files () {
    _wanted files expl 'local files' _files
}

# Add thrift
export PATH="/usr/local/opt/thrift@0.9/bin:$PATH"

# set up python
export WORKON_HOME=$HOME/.virtualenvs
export PROJECT_HOME=$HOME/repos
export PIP_REQUIRE_VIRTUALENV=true
export PATH="$PATH:/Applications/Visual Studio Code.app/Contents/Resources/app/bin"

global-pip() {
  PIP_REQUIRE_VIRTUALENV="" pip "$@"
}

# set up node
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm

export GOPATH=$HOME/Github/go
export PATH=$PATH:$GOPATH/bin
export LOG_FORMAT=colored
export FZF_DEFAULT_OPTS='
  --color=bg+:24
'
export FZF_CTRL_T__OPTS='
  --color=bg+:24
'
export FZF_DEFAULT_COMMAND='ag . --files-with-matches --ignore-dir "*node_modules/*" --ignore-dir "*ts-node*/*" --ignore "*.pyc"'
export FZF_CTRL_T_COMMAND='ag . --files-with-matches --ignore-dir "*node_modules/*" --ignore-dir "*ts-node*/*" --ignore "*.pyc"'

function vs {
  vim $(fzf)
}

function o {
  open $(fzf)
}


# disable virtualenv prompt
export VIRTUAL_ENV_DISABLE_PROMPT=0

# create custome prompt when using virtualenv

function virtualenv_info(){
    # Get Virtual Env
    if [[ -n "$VIRTUAL_ENV" ]]; then
        # Strip out the path and just leave the env name
        venv="${VIRTUAL_ENV##*/}"
    else
        # In case you dont have one activated
        venv=''
    fi
    [[ -n "$venv" ]] && echo "🐍 ($venv)"
}

autoload -Uz vcs_info
precmd () { vcs_info }
setopt prompt_subst

CUSTOM_VENV_PROMPT="\$(virtualenv_info)";
AVATAR="⚡️"
WORKING_DIRECTORY="%~"
NEWLINE=$'\n'
TIME="%*"
PROMPT="${NEWLINE}${AVATAR} "
RPROMPT='$(virtualenv_info) ${WORKING_DIRECTORY} [$vcs_info_msg_0_] @ ${TIME}'
# Pulls out just the branch
zstyle ':vcs_info:git:*' formats '%b'


# Add git autocomplete
autoload -Uz compinit && compinit
fpath=(~/.zsh $fpath)

export NVM_DIR=~/.nvm

alias git=hub
alias a='atom'
alias l='ls'
alias gs='git status'
alias gp='git pull'
alias gd='git diff'
alias gco='git checkout'
alias gsw='git switch'
alias gr='git restore'
alias gdc='git diff --cached'
alias gcm='git commit -m'
alias gca='git commit --amend --no-edit'
alias be='bundle exec'
alias ber='bundle exec rake' alias dot='cd ~/dotfiles' alias dsync='sh ~/dotfiles/sync.sh; source ~/.zshrc'
alias f='fzf | pbcopy'
alias v='vim'
alias vv='cd ~/code/notes/ && /usr/local/bin/vim -c "set syntax=markdown"'
alias rename='~/dotfiles/bin/rename-identifier'
alias repos='cd ~/code/'
alias pb='cd ~/code/pinboard'
alias wa='cd ~/code/pinboard/webapp'

[ -f  ~/dotfiles/.bashrc.private ] && source ~/dotfiles/.bashrc.private

[ -f ~/.fzf.bash ] && source ~/.fzf.bash

source ~/dotfiles/utilities/fzf_functions.sh
source ~/dotfiles/venv_wrapper

# set vim as default editor
export EDITOR=vim
export VISUAL="$EDITOR"

# enable reverse search
bindkey -v
bindkey '^R' history-incremental-search-backward
# setup ctrl-a and other bash-like defaults
bindkey -e
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
