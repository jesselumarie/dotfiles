#!/bin/bash
set -euo pipefail
############################
# sync.sh
# This script creates symlinks from the home directory to any desired dotfiles in ~/dotfiles
############################

########## Variables

dir="$HOME/dotfiles"
olddir="$HOME/dotfiles_backup"
files=".bash_profile .bashrc .vimrc .gitconfig .gitignore_global .config .zshrc .zshrc.messy .tmux.conf"

##########

# Ensure dotfiles are at ~/dotfiles
if [[ ! -d "$dir" ]]; then
    echo "ERROR: dotfiles must be cloned to ~/dotfiles (not found at $dir)"
    exit 1
fi

# create dotfiles_old in homedir
echo "Creating $olddir for backup of any existing dotfiles in ~"
mkdir -p "$olddir"
echo "...done"

# move any existing dotfiles in homedir to dotfiles_old directory, then create symlinks
for file in $files; do
    # Back up existing non-symlink files
    if [[ -e "$HOME/$file" && ! -L "$HOME/$file" ]]; then
        echo "Backing up ~/$file to $olddir/"
        mv "$HOME/$file" "$olddir/"
    fi
    echo "Creating symlink to $file in home directory."
    ln -sf "$dir/$file" "$HOME/$file"
done

# Symlink individual files within .claude (don't symlink the whole dir — it has runtime data)
echo "Symlinking .claude config files"
mkdir -p ~/.claude
if [[ -f ~/.claude/settings.json && ! -L ~/.claude/settings.json ]]; then
    mv ~/.claude/settings.json "$olddir/claude-settings.json"
fi
ln -sf "$dir/.claude/settings.json" ~/.claude/settings.json
if [[ -f ~/.claude/CLAUDE.md && ! -L ~/.claude/CLAUDE.md ]]; then
    mv ~/.claude/CLAUDE.md "$olddir/claude-CLAUDE.md"
fi
ln -sf "$dir/.claude/CLAUDE.md" ~/.claude/CLAUDE.md
echo "...done"

# Symlink .codex/AGENTS.md -> .claude/CLAUDE.md (codex uses the same instructions)
echo "Symlinking .codex/AGENTS.md"
mkdir -p ~/.codex
if [[ -f ~/.codex/AGENTS.md && ! -L ~/.codex/AGENTS.md ]]; then
    mv ~/.codex/AGENTS.md "$olddir/codex-AGENTS.md"
fi
ln -sf ~/.claude/CLAUDE.md ~/.codex/AGENTS.md
echo "...done"
