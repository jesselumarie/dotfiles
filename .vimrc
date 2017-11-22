:syntax on
set number
set clipboard=unnamed
set softtabstop=2 "how many columns when you hit Tab in insert mode
set tabstop=2 "how wide a 'tab' is
set shiftwidth=2 "how many columns text is indented with >> and <<
set expandtab

" Install vim-plugged plugins
call plug#begin('~/.vim/plugged')
Plug 'wincent/command-t'
Plug 'mileszs/ack.vim'
Plug 'rakr/vim-one'
Plug 'tpope/vim-surround'
call plug#end()

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

autocmd BufWritePre * %s/\s\+$//e " Auto-strip trailing whitespace on write

" Remap Ack -> Ack! command; ignore gitignore
map <leader>a :Ack<CR>
cnoreabbrev Ack Ack!
nnoremap <Leader>a :Ack!<Space>
if executable('ag')
  let g:ackprg = 'ag --vimgrep --ignore-dir .gitignore'
endif

" Have Command-T ignore node_modules directories
let g:CommandTWildIgnore=&wildignore . ",*/node_modules/*"

" Add a color scheme
colorscheme one
set background=dark " for the dark version
" set background=light " for the light version
call one#highlight('PmenuSel', 'cccccc', '', 'none')
