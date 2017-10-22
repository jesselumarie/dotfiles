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
call plug#end()

let g:fzf_colors =
\ { 'fg':      ['fg', 'Normal'],
  \ 'bg':      ['bg', 'Normal'],
  \ 'hl':      ['fg', 'Comment'],
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

map <leader>a :Ack<CR>
cnoreabbrev Ack Ack!
nnoremap <Leader>a :Ack!<Space>
if executable('ag')
  let g:ackprg = 'ag --vimgrep'
endif
