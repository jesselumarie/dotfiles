:syntax on
set number
set clipboard=unnamed
set softtabstop=2 "how many columns when you hit Tab in insert mode
set tabstop=2 "how wide a 'tab' is
set shiftwidth=2 "how many columns text is indented with >> and <<
set expandtab
set backspace=2 "make backspace work like you'd expect
set ignorecase
set smartcase "case-sensitive search only if caps present
set hlsearch "highlight found search terms
set nowrap "don't wrap long lines by default
set incsearch "jump to words as you search

" Easy spelling command
:command Spell :setlocal spell! spelllang=en_us

nmap <esc><esc> :noh <CR>


" Install vim-plugged plugins
call plug#begin('~/.vim/plugged')
Plug 'wincent/command-t'
Plug 'mileszs/ack.vim'
Plug 'rakr/vim-one'
Plug 'tpope/vim-surround'
Plug 'tpope/vim-commentary'
Plug 'tpope/vim-fugitive'
Plug 'tpope/vim-rhubarb' "Adds GitHub extensions to vim-fugitive
Plug 'gabrielelana/vim-markdown'
Plug 'w0rp/ale'
Plug 'terryma/vim-smooth-scroll'
Plug 'leafgarland/typescript-vim'
Plug 'scrooloose/nerdtree'
Plug 'Quramy/tsuquyomi'
call plug#end()

""""""""""""""""""""""""""""""""""""""""
"PLUGIN OPTIONS

""""""""""""""""""""""""""""""""""""""""

" don't check typescript on save
let g:tsuquyomi_disable_quickfix = 1

let g:fzf_colors =
\ { 'fg':      ['fg', 'Normal'],
  \ 'bg':      ['bg', 'Normal'],
  \ 'hl':      ['fg', 'Normal'],
  \ 'fg+':     ['fg', 'CursorLine', 'CursorColumn', 'Normal'],
  \ 'bg+':     ['bg', 'CursorLine', 'CursorColumn'],
  \ 'hl+':     ['fg', 'Statement'],
  \ 'info':    ['fg', 'PreProc'],
  \ 'prompt':  ['fg', 'Conditional'],
  \ 'pointer': ['fg', 'Exception'],
  \ 'marker':  ['fg', 'Keyword'],
  \ 'spinner': ['fg', 'Label'],
  \ 'header':  ['fg', 'Comment'] }

" Set ag as search if available
if executable('ag')
  let g:ackprg = 'ag --vimgrep --ignore-dir .gitignore'
endif

" Have Command-T ignore node_modules directories
let g:CommandTWildIgnore=&wildignore . ",*/node_modules/*,ts-node-*"

" only enable certain linters
let g:ale_linters = {
\   'javascript': ['eslint'],
\   'python': ['flake8'],
\   'typescript': ['tslint'],
\}
let g:ale_python_flake8_executable='/bin/sh -c "cd $(dirname %) && /users/jesselumarie/.virtualenvs/$(basename ~+)/bin/flake8"'
let g:ale_linters_explicit = 1

""""""""""""""""""""""""""""""""""""""
" MAPPINGS
""""""""""""""""""""""""""""""""""""""
" Check typescript compilation
nnoremap <leader>e :TsuGeterr<CR>

" Toggle NERD Tree
nnoremap <leader>r :NERDTreeToggle<CR>
"
" Find NERD Tree
nnoremap <leader>f :NERDTreeFind<CR>

" :only remap
nnoremap <leader>1 :only<CR>

" Remap Ack -> Ack! command; ignore gitignore
map <leader>a :Ack<CR>
cnoreabbrev Ack Ack!
nnoremap <Leader>a :Ack!<Space>

" Remap moving between windows
nnoremap <C-J> <C-W><C-J>
nnoremap <C-K> <C-W><C-K>
nnoremap <C-L> <C-W><C-L>
nnoremap <C-H> <C-W><C-H>

" move to wrapped line instead of skipping
" stolen from https://github.com/dstrelau/dotfiles/blob/master/vimrc
nmap j gj
nmap k gk
vmap j gj
vmap k gk


" Toggle non-display characters
nmap <leader>c :set list!<CR>
set listchars=tab:▸\ ,eol:¬,space:·

nnoremap <Leader>w :CommandTBuffer<CR>

" Add a color scheme
colorscheme one
set background=dark " for the dark version
" set background=light " for the light version

" Autocomplete Menu Selection Color
call one#highlight('PmenuSel', 'ffffff', '', 'none')
call one#highlight('Pmenu', '8b8d91', '', 'none')

" Smooth scrolling
noremap <silent> <c-u> :call smooth_scroll#up(&scroll, 0, 2)<CR>
noremap <silent> <c-d> :call smooth_scroll#down(&scroll, 0, 2)<CR>
noremap <silent> <c-b> :call smooth_scroll#up(&scroll*2, 0, 4)<CR>
noremap <silent> <c-f> :call smooth_scroll#down(&scroll*2, 0, 4)<CR>


""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" MULTIPURPOSE TAB KEY
" Indent if we're at the beginning of a line. Else, do completion.
" stolen from https://github.com/garybernhardt/dotfiles/blob/master/.vimrc
""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
function! InsertTabWrapper()
    let col = col('.') - 1
    if !col || getline('.')[col - 1] !~ '\k'
        return "\<tab>"
    else
        return "\<c-p>"
    endif
endfunction
inoremap <expr> <tab> InsertTabWrapper()
inoremap <s-tab> <c-n>

" turn on omnicomplete
filetype plugin on
set omnifunc=syntaxcomplete#Complete


""" AUTO COMMANDS
autocmd BufWritePre * %s/\s\+$//e " Auto-strip trailing whitespace on write

" stolen from https://github.com/garybernhardt/dotfiles/blob/master/.vimrc
" Jump to last cursor position unless it's invalid or in an event handler
autocmd BufReadPost *
  \ if line("'\"") > 0 && line("'\"") <= line("$") |
  \   exe "normal g`\"" |
  \ endif
