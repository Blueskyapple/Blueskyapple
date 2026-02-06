#!/usr/bin/env bash
# BlueBot — one-line installer
# Usage: curl -sSL https://raw.githubusercontent.com/Blueskyapple/Blueskyapple/main/install.sh | bash
set -euo pipefail

REPO="https://github.com/Blueskyapple/Blueskyapple.git"
INSTALL_DIR="${BLUEBOT_DIR:-$HOME/bluebot}"

echo ""
echo "  ____  _            ____        _   "
echo " | __ )| |_   _  ___| __ )  ___ | |_ "
echo " |  _ \\| | | | |/ _ \\  _ \\ / _ \\| __|"
echo " | |_) | | |_| |  __/ |_) | (_) | |_ "
echo " |____/|_|\\__,_|\\___|____/ \\___/ \\__|"
echo ""
echo "  Installing BlueBot..."
echo ""

# Check Python
if ! command -v python3 &>/dev/null; then
    echo "Error: Python 3.10+ is required but not found."
    echo "Install Python from https://python.org"
    exit 1
fi

PY_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
PY_MAJOR=$(echo "$PY_VERSION" | cut -d. -f1)
PY_MINOR=$(echo "$PY_VERSION" | cut -d. -f2)

if [ "$PY_MAJOR" -lt 3 ] || { [ "$PY_MAJOR" -eq 3 ] && [ "$PY_MINOR" -lt 10 ]; }; then
    echo "Error: Python 3.10+ is required (found $PY_VERSION)."
    exit 1
fi

echo "Found Python $PY_VERSION"

# Clone or update
if [ -d "$INSTALL_DIR" ]; then
    echo "Updating existing installation at $INSTALL_DIR..."
    cd "$INSTALL_DIR"
    git pull --ff-only
else
    echo "Cloning BlueBot to $INSTALL_DIR..."
    git clone "$REPO" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# Create venv
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

echo "Installing dependencies..."
.venv/bin/pip install --quiet --upgrade pip
.venv/bin/pip install --quiet -e ".[all]"

# Create .env if missing
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo ""
    echo "Created .env from template."
    echo "Edit $INSTALL_DIR/.env to add your API key."
fi

# Create shell alias
SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
    SHELL_RC="$HOME/.bashrc"
fi

if [ -n "$SHELL_RC" ]; then
    if ! grep -q "alias bluebot=" "$SHELL_RC" 2>/dev/null; then
        echo "" >> "$SHELL_RC"
        echo "# BlueBot" >> "$SHELL_RC"
        echo "alias bluebot='$INSTALL_DIR/.venv/bin/bluebot'" >> "$SHELL_RC"
        echo "Added 'bluebot' alias to $SHELL_RC"
    fi
fi

echo ""
echo "Installation complete!"
echo ""
echo "Next steps:"
echo "  1. Edit $INSTALL_DIR/.env and add your API key"
echo "  2. Run: $INSTALL_DIR/.venv/bin/bluebot"
echo "     (or restart your shell and run: bluebot)"
echo ""
