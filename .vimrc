syntax on
set number relativenumber
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
" Folding settings (from
" https://github.com/dstrelau/dstrelau/blob/master/.vimrc)
set nofoldenable
set foldlevel=99               " don't fold unless told to
set foldmethod=manual
set foldopen-=block            " block movement shouldn't open folds
set foldminlines=2             " don't fold a single line
set foldlevel=99               " start with no folding
set foldnestmax=1              " only 2 nested folds
set visualbell                 " No loud noises i'm old

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
Plug 'tpope/vim-ragtag'
Plug 'gabrielelana/vim-markdown'
Plug 'w0rp/ale'
Plug 'terryma/vim-smooth-scroll'
Plug 'leafgarland/typescript-vim'
Plug 'scrooloose/nerdtree'
Plug 'Quramy/tsuquyomi'
Plug 'prettier/vim-prettier', {
  \ 'do': 'yarn install',
  \ 'for': ['javascript', 'typescript', 'css', 'less', 'scss', 'json', 'graphql', 'markdown', 'vue', 'yaml', 'html'] }
Plug 'solarnz/thrift.vim'
Plug 'airblade/vim-gitgutter'
Plug 'psf/black'
Plug 'jparise/vim-phabricator'
Plug 'peplin/vim-phabrowse'
Plug 'https://github.com/kristijanhusak/vim-js-file-import'
call plug#end()

""""""""""""""""""""""""""""""""""""""""
"PLUGIN OPTIONS

""""""""""""""""""""""""""""""""""""""""
"Use locally installed flow
let local_flow = finddir('node_modules', '.;') . '/.bin/flow'
if matchstr(local_flow, "^\/\\w") == ''
    let local_flow= getcwd() . "/" . local_flow
endif
if executable(local_flow)
  let g:flow#flowpath = local_flow
endif

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
\   'javascript': ['eslint', 'flow'],
\   'python': ['flake8'],
\   'typescript': ['tslint'],
\}

let g:ale_fixers = {'javascript': ['prettier-eslint']}
let g:ale_python_flake8_executable='/bin/sh -c "cd $(dirname %) && /users/jesselumarie/.virtualenvs/$(basename ~+)/bin/flake8"'
let g:ale_linters_explicit = 1
let g:ale_javascript_prettier_use_local_config = 1

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

map <leader>an :ALENext<CR>
map <leader>ap :ALEPrevious<CR>

" Remap moving between windows
nnoremap <C-J> <C-W><C-J>
nnoremap <C-K> <C-W><C-K>
nnoremap <C-L> <C-W><C-L>
nnoremap <C-H> <C-W><C-H>

" Copy current path to clipboard
nnoremap <leader>y :let @+=expand("%")<CR>:f<CR>

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
set omnifunc=ale#completion#OmniFunc
" turn on auto import
let g:ale_completion_autoimport = 1

" set wildcard ignore for vim-js-file-import
set wildignore+=*node_modules/**


""" AUTO COMMANDS
autocmd BufWritePre * %s/\s\+$//e " Auto-strip trailing whitespace on write

" stolen from https://thoughtbot.com/blog/wrap-existing-text-at-80-characters-in-vim
" Make markdown wrap
au BufRead,BufNewFile *.md setlocal textwidth=80

" stolen from https://github.com/garybernhardt/dotfiles/blob/master/.vimrc
" Jump to last cursor position unless it's invalid or in an event handler
autocmd BufReadPost *
  \ if line("'\"") > 0 && line("'\"") <= line("$") |
  \   exe "normal g`\"" |
  \ endif


" for python files, use indent folding method
au BufNewFile,BufRead *.py set foldmethod=indent

" When entering insert mode, relative line numbers are turned off,
" leaving absolute line numbers turned on.
" This also happens when the buffer loses focus,
" so you can glance back at it to see which absolute line you were working on if you need to.
" https://jeffkreeftmeijer.com/vim-number/
augroup numbertoggle
  autocmd!
  autocmd BufEnter,FocusGained,InsertLeave * set relativenumber
  autocmd BufLeave,FocusLost,InsertEnter   * set norelativenumber
augroup END

" Store private information for a local machine
if !empty(glob('~/dotfiles/.vimrc.private'))
  source ~/dotfiles/.vimrc.private
endif

