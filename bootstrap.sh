#!/usr/bin/env bash
set -euo pipefail

DOTFILES_DIR="$(cd "$(dirname "$0")" && pwd)"

# ---------------------------------------------------------------------------
# Colored output helpers
# ---------------------------------------------------------------------------
info()  { printf '\033[1;34m[INFO]\033[0m  %s\n' "$*"; }
ok()    { printf '\033[1;32m[OK]\033[0m    %s\n' "$*"; }
warn()  { printf '\033[1;33m[WARN]\033[0m  %s\n' "$*"; }
error() { printf '\033[1;31m[ERROR]\033[0m %s\n' "$*"; }

# ---------------------------------------------------------------------------
# 1. Detect OS
# ---------------------------------------------------------------------------
detect_os() {
  case "$(uname -s)" in
    Darwin) OS="macos" ;;
    Linux)  OS="linux" ;;
    *)      error "Unsupported OS: $(uname -s)"; exit 1 ;;
  esac

  if [[ "$OS" == "linux" ]]; then
    if command -v apt-get &>/dev/null; then
      PKG_MGR="apt"
    elif command -v dnf &>/dev/null; then
      PKG_MGR="dnf"
    else
      error "No supported package manager found (need apt-get or dnf)"; exit 1
    fi
  fi

  ok "Detected OS: $OS${PKG_MGR:+ (pkg manager: $PKG_MGR)}"
}

# ---------------------------------------------------------------------------
# 2. Install Homebrew (macOS only)
# ---------------------------------------------------------------------------
install_homebrew() {
  [[ "$OS" != "macos" ]] && return 0

  if command -v brew &>/dev/null; then
    ok "Homebrew already installed"
    return 0
  fi

  info "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  eval "$(/opt/homebrew/bin/brew shellenv)"
  ok "Homebrew installed"
}

# ---------------------------------------------------------------------------
# 3. Install core packages
# ---------------------------------------------------------------------------
install_core_packages_macos() {
  info "Installing packages from Brewfile..."
  brew bundle --file="$DOTFILES_DIR/Brewfile" --no-lock
  ok "Brewfile packages installed"

  # fzf shell integration
  if [[ ! -f ~/.fzf.zsh ]]; then
    info "Setting up fzf shell integration..."
    "$(brew --prefix)"/opt/fzf/install --key-bindings --completion --no-update-rc --no-bash --no-fish
    ok "fzf shell integration configured"
  else
    ok "fzf shell integration already configured"
  fi
}

install_core_packages_linux() {
  info "Installing core packages via $PKG_MGR..."

  if [[ "$PKG_MGR" == "apt" ]]; then
    sudo apt-get update -y

    # gh CLI — official repo
    if ! command -v gh &>/dev/null; then
      info "Adding GitHub CLI apt repository..."
      sudo mkdir -p /etc/apt/keyrings
      curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
        | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg >/dev/null
      echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
        | sudo tee /etc/apt/sources.list.d/github-cli.list >/dev/null
      sudo apt-get update -y
    fi

    sudo apt-get install -y zsh git neovim fzf silversearcher-ag gh rbenv
  elif [[ "$PKG_MGR" == "dnf" ]]; then
    sudo dnf install -y zsh git neovim fzf the_silver_searcher gh rbenv
  fi

  # ruby-build plugin for rbenv
  if [[ ! -d "$(rbenv root)/plugins/ruby-build" ]]; then
    info "Installing ruby-build plugin..."
    git clone https://github.com/rbenv/ruby-build.git "$(rbenv root)/plugins/ruby-build"
    ok "ruby-build installed"
  else
    ok "ruby-build already installed"
  fi

  # pyenv — try package manager first, fall back to installer
  if command -v pyenv &>/dev/null || [[ -x "$HOME/.pyenv/bin/pyenv" ]]; then
    ok "pyenv already installed"
  else
    if [[ "$PKG_MGR" == "apt" ]]; then
      # pyenv is not in default apt repos on most distros; use installer
      info "Installing pyenv via pyenv-installer..."
      curl -fsSL https://pyenv.run | bash
    elif [[ "$PKG_MGR" == "dnf" ]]; then
      sudo dnf install -y pyenv 2>/dev/null || {
        info "pyenv not in dnf repos, falling back to pyenv-installer..."
        curl -fsSL https://pyenv.run | bash
      }
    fi
    ok "pyenv installed"
  fi

  # mise
  if command -v mise &>/dev/null; then
    ok "mise already installed"
  else
    info "Installing mise..."
    curl -fsSL https://mise.run | sh
    ok "mise installed"
  fi

  # fzf shell integration
  if [[ ! -f ~/.fzf.zsh ]]; then
    info "Setting up fzf shell integration..."
    if [[ -f /usr/share/doc/fzf/examples/key-bindings.zsh ]]; then
      mkdir -p ~/.fzf
      cp /usr/share/doc/fzf/examples/key-bindings.zsh ~/.fzf/
      cp /usr/share/doc/fzf/examples/completion.zsh ~/.fzf/
      cat > ~/.fzf.zsh <<'FZFEOF'
source ~/.fzf/key-bindings.zsh
source ~/.fzf/completion.zsh
FZFEOF
    fi
    ok "fzf shell integration configured"
  else
    ok "fzf shell integration already configured"
  fi

  ok "Core Linux packages installed"
}

install_core_packages() {
  if [[ "$OS" == "macos" ]]; then
    install_core_packages_macos
  else
    install_core_packages_linux
  fi
}

# ---------------------------------------------------------------------------
# 4. Install nvm
# ---------------------------------------------------------------------------
install_nvm() {
  local nvm_dir="${XDG_CONFIG_HOME:-$HOME/.config}/nvm"

  if [[ -s "$nvm_dir/nvm.sh" ]]; then
    ok "nvm already installed at $nvm_dir"
    return 0
  fi

  info "Installing nvm..."
  mkdir -p "$nvm_dir"
  export NVM_DIR="$nvm_dir"
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  ok "nvm installed to $nvm_dir"
}

# ---------------------------------------------------------------------------
# 5. Install bun
# ---------------------------------------------------------------------------
install_bun() {
  if command -v bun &>/dev/null; then
    ok "bun already installed"
    return 0
  fi

  info "Installing bun..."
  curl -fsSL https://bun.sh/install | bash
  ok "bun installed"
}

# ---------------------------------------------------------------------------
# 6. Install vim-plug
# ---------------------------------------------------------------------------
install_vim_plug() {
  local vim_autoload="$HOME/.vim/autoload/plug.vim"
  local nvim_autoload="${XDG_DATA_HOME:-$HOME/.local/share}/nvim/site/autoload/plug.vim"

  local installed=0

  if [[ -f "$vim_autoload" ]]; then
    installed=$((installed + 1))
  else
    info "Installing vim-plug for vim..."
    curl -fsSLo "$vim_autoload" --create-dirs \
      https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
  fi

  if [[ -f "$nvim_autoload" ]]; then
    installed=$((installed + 1))
  else
    info "Installing vim-plug for neovim..."
    curl -fsSLo "$nvim_autoload" --create-dirs \
      https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
  fi

  if [[ $installed -eq 2 ]]; then
    ok "vim-plug already installed for both vim and neovim"
  else
    ok "vim-plug installed"
  fi
}

# ---------------------------------------------------------------------------
# 7. Install graphite on Linux (macOS gets it from Brewfile)
# ---------------------------------------------------------------------------
install_graphite_linux() {
  [[ "$OS" != "linux" ]] && return 0

  if command -v gt &>/dev/null; then
    ok "graphite (gt) already installed"
    return 0
  fi

  info "Installing graphite via npm..."
  # Source nvm so npm is available
  local nvm_dir="${XDG_CONFIG_HOME:-$HOME/.config}/nvm"
  export NVM_DIR="$nvm_dir"
  # shellcheck disable=SC1091
  [[ -s "$nvm_dir/nvm.sh" ]] && . "$nvm_dir/nvm.sh"

  if ! command -v npm &>/dev/null; then
    info "Installing Node.js via nvm first..."
    nvm install --lts
  fi

  npm install -g @withgraphite/graphite-cli
  ok "graphite installed"
}

# ---------------------------------------------------------------------------
# 8. Set default shell to zsh
# ---------------------------------------------------------------------------
set_default_shell() {
  if [[ "$SHELL" == *"zsh"* ]]; then
    ok "Default shell is already zsh"
    return 0
  fi

  local zsh_path
  zsh_path="$(command -v zsh)"

  # Ensure zsh is in /etc/shells
  if ! grep -qx "$zsh_path" /etc/shells 2>/dev/null; then
    info "Adding $zsh_path to /etc/shells..."
    echo "$zsh_path" | sudo tee -a /etc/shells >/dev/null
  fi

  info "Changing default shell to zsh..."
  chsh -s "$zsh_path"
  ok "Default shell set to zsh (restart your terminal to take effect)"
}

# ---------------------------------------------------------------------------
# 9. Run sync.sh — symlink dotfiles
# ---------------------------------------------------------------------------
run_sync() {
  info "Running sync.sh to symlink dotfiles..."
  bash "$DOTFILES_DIR/sync.sh"
  ok "Dotfiles symlinked"
}

# ---------------------------------------------------------------------------
# 10. On Linux/devcontainers, use HTTPS for GitHub (SSH keys often missing)
# ---------------------------------------------------------------------------
configure_git_https() {
  [[ "$OS" != "linux" ]] && return 0

  local current
  current="$(git config --global --get url."https://github.com/".insteadOf 2>/dev/null || true)"
  if [[ "$current" == "git@github.com:" ]]; then
    ok "git already configured to use HTTPS for GitHub"
  else
    info "Configuring git to use HTTPS for GitHub..."
    git config --global url."https://github.com/".insteadOf "git@github.com:"
    ok "git configured to use HTTPS for GitHub"
  fi
}

# ---------------------------------------------------------------------------
# 11. Install vim plugins
# ---------------------------------------------------------------------------
install_vim_plugins() {
  if ! command -v nvim &>/dev/null; then
    warn "neovim not found, skipping plugin install"
    return 0
  fi

  info "Installing vim plugins via vim-plug..."
  nvim --headless +PlugInstall +qall 2>/dev/null
  ok "Vim plugins installed"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
  info "Starting dotfiles bootstrap from $DOTFILES_DIR"
  echo ""

  detect_os
  install_homebrew
  install_core_packages
  install_nvm
  install_bun
  install_vim_plug
  install_graphite_linux
  set_default_shell
  run_sync
  configure_git_https
  install_vim_plugins

  echo ""
  ok "Bootstrap complete!"
}

main "$@"
