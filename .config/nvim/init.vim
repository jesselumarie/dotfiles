set runtimepath^=~/.vim runtimepath+=~/.vim/after
let &packpath = &runtimepath
source ~/.vimrc

lua <<EOF
-- Mappings.
-- See `:help vim.diagnostic.*` for documentation on any of the below functions

local opts = { noremap=true, silent=true }
vim.keymap.set('n', '<leader>a', vim.diagnostic.goto_prev, opts)
vim.keymap.set('n', '<leader>an', vim.diagnostic.goto_next, opts)
vim.keymap.set('n', '<space>q', vim.diagnostic.setloclist, opts)
vim.keymap.set('n', '<leader>d', vim.lsp.buf.definition, bufopts)
vim.keymap.set('n', '<space>e', vim.diagnostic.open_float, opts)

-- Testing out some folding options
-- https://www.jackfranklin.co.uk/blog/code-folding-in-vim-neovim/
vim.opt.foldcolumn = "0"
vim.opt.foldmethod = "expr"
vim.opt.foldexpr = "v:lua.vim.treesitter.foldexpr()"
vim.opt.foldtext = ""

vim.opt.foldnestmax = 3
vim.opt.foldlevel = 99
vim.opt.foldlevelstart = 99


-- Remove Copilot from copilot-chat filetype
vim.g.copilot_filetypes = {
  ["copilot-chat"] = false,
}
-- Use an on_attach function to only map the following keys
-- after the language server attaches to the current buffer
local on_attach = function(client, bufnr)
  -- Enable completion triggered by <c-x><c-o>
  vim.api.nvim_buf_set_option(bufnr, 'omnifunc', 'v:lua.vim.lsp.omnifunc')

  -- Mappings.
  -- See `:help vim.lsp.*` for documentation on any of the below functions
  local bufopts = { noremap=true, silent=true, buffer=bufnr }
  vim.keymap.set('n', 'K', vim.lsp.buf.hover, bufopts)
  vim.keymap.set('n', 'gi', vim.lsp.buf.implementation, bufopts)
  vim.keymap.set('n', '<C-k>', vim.lsp.buf.signature_help, bufopts)
  vim.keymap.set('n', '<space>td', vim.lsp.buf.type_definition, bufopts)
  vim.keymap.set('n', '<space>rn', vim.lsp.buf.rename, bufopts)
  vim.keymap.set('n', '<space>ca', vim.lsp.buf.code_action, bufopts)
  vim.keymap.set('n', '<space>rr', vim.lsp.buf.references, bufopts)
  vim.keymap.set('n', '<space>f', function() vim.lsp.buf.format { async = true } end, bufopts)
end

local sorbet_root_dir = function()
    return os.getenv("SORBET_ROOT") or vim.fn.getcwd()
end

-- LSP setup: use native vim.lsp.config/enable on 0.11+, fall back to lspconfig on 0.10
if vim.fn.has('nvim-0.11') == 1 then
  vim.lsp.config('pyright', {
    cmd = { 'pyright-langserver', '--stdio' },
    filetypes = { 'python' },
    root_markers = { 'pyproject.toml', 'setup.py', 'pyrightconfig.json', '.git' },
    on_attach = on_attach,
  })

  vim.lsp.config('tsgo', {
    cmd = { 'tsgo', '--lsp' },
    filetypes = { 'javascript', 'javascriptreact', 'javascript.jsx', 'typescript', 'typescriptreact', 'typescript.tsx' },
    root_markers = { 'tsconfig.json', '.git' },
    on_attach = on_attach,
  })

  vim.lsp.config('clangd', {
    cmd = { 'clangd' },
    filetypes = { 'c', 'cpp', 'objc', 'objcpp' },
    root_markers = { 'compile_commands.json', '.clangd', '.git' },
    on_attach = on_attach,
  })

  vim.lsp.config('sorbet', {
    cmd = { 'bundle', 'exec', 'srb', 'tc', '--lsp' },
    filetypes = { 'ruby' },
    root_dir = sorbet_root_dir,
    on_attach = on_attach,
  })

  vim.lsp.config('solargraph', {
    cmd = { 'bundle', 'exec', 'solargraph', 'stdio' },
    filetypes = { 'ruby' },
    root_dir = sorbet_root_dir,
    on_attach = on_attach,
  })

  vim.lsp.config('eslint', {
    cmd = { 'vscode-eslint-language-server', '--stdio' },
    filetypes = { 'javascript', 'javascriptreact', 'javascript.jsx', 'typescript', 'typescriptreact', 'typescript.tsx' },
    root_markers = { '.eslintrc', '.eslintrc.js', '.eslintrc.json', 'eslint.config.js', '.git' },
    capabilities = vim.lsp.protocol.make_client_capabilities(),
    on_attach = function(client, bufnr)
      vim.api.nvim_create_autocmd("BufWritePre", {
        buffer = bufnr,
        command = "EslintFixAll",
      })
    end,
  })

  vim.lsp.config('gopls', {
    cmd = { 'gopls' },
    filetypes = { 'go', 'gomod', 'gowork', 'gotmpl' },
    root_markers = { 'go.mod', '.git' },
    on_attach = on_attach,
  })

  vim.lsp.enable({ 'pyright', 'tsgo', 'clangd', 'sorbet', 'solargraph', 'eslint', 'gopls' })
else
  -- nvim 0.10: use lspconfig
  local util = require("lspconfig/util")

  require('lspconfig')['pyright'].setup{
    on_attach = on_attach,
  }
  require('lspconfig')['tsserver'].setup{
    filetypes = {"javascript", "javascriptreact", "javascript.jsx", "typescript", "typescriptreact", "typescript.tsx"},
    on_attach = on_attach,
    root_dir = util.root_pattern("tsconfig.json", ".git"),
    init_options = {
      maxTsServerMemory = 24576,
      nodePath = "/usr/local/bin/node",
    },
  }
  require('lspconfig')['clangd'].setup{
    on_attach = on_attach,
  }
  require('lspconfig')['sorbet'].setup{
    on_attach = on_attach,
    root_dir = sorbet_root_dir,
    cmd = { "bundle", "exec", "srb", "tc", "--lsp" },
  }
  require('lspconfig')['solargraph'].setup{
    on_attach = on_attach,
    root_dir = sorbet_root_dir,
    cmd = { "bundle", "exec", "solargraph", "stdio" },
  }
  require('lspconfig')['eslint'].setup{
    capabilities = vim.lsp.protocol.make_client_capabilities(),
    on_attach = function(client, bufnr)
      vim.api.nvim_create_autocmd("BufWritePre", {
        buffer = bufnr,
        command = "EslintFixAll",
      })
    end,
  }
  require("lspconfig")['gopls'].setup{
    on_attach = on_attach,
  }
end

require("CopilotChat").setup({
    mappings = {
        reset = {
          normal = '<space>k',
          insert = '<space>k',
        },
      accept_diff = {
        normal = '<space>a',
        insert = '<space>a',
      },
      show_diff = {
        normal = '<space>sd',
        insert = '<space>sd',
      }
    }
})

require('claude-code').setup({
  window = {
    split_ratio = 0.3,        -- Percentage of screen for the terminal window (height or width)
    position = "vsplit",      -- "botright", "topleft", "vertical"/"vsplit", "float", etc.
    hide_numbers = true,      -- Hide line numbers in the terminal window
    hide_signcolumn = true,   -- Hide the sign column in the terminal window
  },
  git = {
    use_git_root = true,      -- Set CWD to git root when opening Claude Code (if in git project)
  },
  keymaps = {
    toggle = {
      normal = "<leader>cc",   -- Toggle Claude Code
      variants = {
        continue = "<leader>ck", -- Toggle with "continue" flag
      },
    },
  },
})
EOF
