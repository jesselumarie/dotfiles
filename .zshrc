# set up ruby
# export PATH="$HOME/.rbenv/bin:$PATH"
# export PATH="$HOME/.rbenv/shims:$PATH"
eval "$(rbenv init - zsh)"
export GEM_HOME=$HOME/.gem
export PATH=$GEM_HOME/bin:$PATH
export PATH=/opt/homebrew/bin/:$PATH
export RACK_ENV=development

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
export FZF_DEFAULT_COMMAND='ag . --files-with-matches --ignore-dir "*node_modules/*" --ignore-dir "*ts-node*/*" --ignore "*.pyc" --ignore "*go*/*" --ignore "*monitors/*" --ignore "*jsvm-cpp*/*"'
export FZF_CTRL_T_COMMAND='ag . --files-with-matches --ignore-dir "*node_modules/*" --ignore-dir "*ts-node*/*" --ignore "*.pyc" --ignore "*go*/*" --ignore "*monitors/*" --ignore "*jsvm-cpp*/*"'

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

export NVM_DIR=~/.nvm

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
alias pushit='git push -u origin HEAD'

alias be='bundle exec'
alias ber='bundle exec rake'

alias dot='cd ~/dotfiles'
alias dsync='sh ~/dotfiles/sync.sh; source ~/.zshrc'
alias f='fzf | pbcopy'
alias v='nvim'
alias vv='cd ~/code/notes/ && vim -c "set syntax=markdown"'
alias vim='nvim'
alias rename='~/dotfiles/bin/rename-identifier'
alias repos='cd ~/code/'
alias figma='cd ~/figma/figma'
alias web='cd ~/figma/figma/web'

[ -f  ~/dotfiles/.bashrc.private ] && source ~/dotfiles/.bashrc.private

[ -f ~/.fzf.bash ] && source ~/.fzf.bash

source ~/dotfiles/utilities/fzf_functions.sh
source ~/dotfiles/venv_wrapper


# Adding git completion script
fpath=(~/dotfiles/utilities $fpath)
zstyle ':completion:*:*:git:*' script ~/dotfiles/utilities/git-completion.bash
autoload -Uz compinit && compinit
zmodload -i zsh/complist

# fpath=(~/.zsh $fpath)
# zstyle ':completion:*:*:git:*' script ~/.zsh/git-completion.bash

autoload -Uz compinit && compinit

# set vim as default editor
export EDITOR=vim
export VISUAL="$EDITOR"

# enable reverse search
bindkey -v
bindkey '^R' history-incremental-search-backward
# setup ctrl-a and other bash-like defaults
bindkey -e
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
export PKG_CONFIG_PATH="/opt/homebrew/opt/zlib/lib/pkgconfig:/usr/local/opt/zlib/lib/pkgconfig:$PKG_CONFIG_PATH"
export PKG_CONFIG_PATH="/opt/homebrew/opt/openssl@3/lib/pkgconfig:/usr/local/opt/openssl@3/lib/pkgconfig:$PKG_CONFIG_PATH"
export GOPATH="$HOME/go"
export PATH="$HOME/go/bin:$PATH"
eval "$(rbenv init -)"
export RACK_ENV=development
export PATH="$HOME/.cargo/bin:$PATH"
export PATH="$HOME/.cargo/bin:$PATH"
export PATH="$HOME/.cargo/bin:$PATH"
export PATH="$HOME/.cargo/bin:$PATH"
export AWS_CONFIG_FILE="$HOME/figma/figma/config/aws/sso_config"
