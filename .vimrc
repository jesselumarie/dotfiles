set nocompatible              " be iMproved, required
filetype off                  " required

syntax on
colorscheme onedark

set softtabstop=2
set tabstop=2
set shiftwidth=2
set expandtab
set number
set showmatch
set autoindent

set incsearch           " search as characters are entered
set hlsearch            " highlight matches
set ts=2
set listchars=tab:▸\ ,eol:¬ " Visualize tabs and newlines
set colorcolumn=80
set rtp+=~/.fzf

" F4 to toggle highlighting on/off, and show current value.
noremap <Leader><Leader> :set hlsearch! hlsearch?<CR>

" set the runtime path to include Vundle and initialize
set rtp+=~/.vim/bundle/Vundle.vim

call vundle#begin()
Plugin 'VundleVim/Vundle.vim'
Plugin 'Valloric/YouCompleteMe'
Plugin 'git://git.wincent.com/command-t.git'
Plugin 'airblade/vim-gitgutter'
Plugin 'fatih/vim-go'
call vundle#end()            " required

filetype plugin indent on    " required
