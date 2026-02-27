[ -f ~/.zshrc.messy ] && source ~/.zshrc.messy
[ -f ~/.zshrc.private.figma ] && source ~/.zshrc.private.figma
export MAX_MCP_OUTPUT_TOKENS=100000

# bun completions
[ -s "/Users/jlumarie/.bun/_bun" ] && source "/Users/jlumarie/.bun/_bun"

# bun
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
command -v brew &>/dev/null && eval "$(brew shellenv)"

command -v rbenv &>/dev/null && eval "$(rbenv init -)"
export RACK_ENV=development
export MISE_ENV=macos # loads mise.macos.toml
export PATH="$HOME/.local/bin:$PATH"
export EDITOR="nvim"
eval "$(rbenv init -)"
