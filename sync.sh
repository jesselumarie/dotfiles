#!/bin/bash
############################
# .make.sh
# This script creates symlinks from the home directory to any desired dotfiles in ~/dotfiles
############################

########## Variables

dir=~/dotfiles                    # dotfiles directory
olddir=~/dotfiles_backup           # old dotfiles backup directory
files=".bash_profile .bashrc .vimrc .gitconfig .gitignore_global .config .zshrc .zshrc.messy"    # list of files/folders to symlink in homedir

##########

# create dotfiles_old in homedir
echo "Creating $olddir for backup of any existing dotfiles in ~"
mkdir -p $olddir
echo "...done"

# change to the dotfiles directory
echo "Changing to the $dir directory"
cd $dir
echo "...done"

# move any existing dotfiles in homedir to dotfiles_old directory, then create symlinks
for file in $files; do
    echo "Moving any existing dotfiles from ~ to $olddir/"
    mv ~/$file $olddir/
    echo "Creating symlink to $file in home directory."
    ln -s $dir/$file ~/$file
    echo "\n"
done

# Symlink individual files within .claude (don't symlink the whole dir — it has runtime data)
echo "Symlinking .claude config files"
mkdir -p ~/.claude
if [[ -f ~/.claude/settings.json && ! -L ~/.claude/settings.json ]]; then
    mv ~/.claude/settings.json $olddir/claude-settings.json
fi
ln -sf $dir/.claude/settings.json ~/.claude/settings.json
if [[ -f ~/.claude/CLAUDE.md && ! -L ~/.claude/CLAUDE.md ]]; then
    mv ~/.claude/CLAUDE.md $olddir/claude-CLAUDE.md
fi
ln -sf $dir/.claude/CLAUDE.md ~/.claude/CLAUDE.md
echo "...done"

# Symlink .codex/AGENTS.md -> .claude/CLAUDE.md (codex uses the same instructions)
echo "Symlinking .codex/AGENTS.md"
mkdir -p ~/.codex
if [[ -f ~/.codex/AGENTS.md && ! -L ~/.codex/AGENTS.md ]]; then
    mv ~/.codex/AGENTS.md $olddir/codex-AGENTS.md
fi
ln -sf ~/.claude/CLAUDE.md ~/.codex/AGENTS.md
echo "...done"
