# AlignView

Interactive multiple sequence alignment (MSA) visualization built with Next.js, TypeScript, and a local Clustal Omega binary.

AlignView runs Clustal Omega on the server side through `POST /api/align`, then renders the aligned sequences with coordinate-aware hover, block display, coloring, consensus, ruler, and range selection tools.

## Requirements

- Linux, macOS, or WSL shell
- `conda` or Miniconda/Miniforge
- `nvm`
- `pnpm`
- Clustal Omega installed through conda

## Step-by-step local deployment

Run all commands from the project directory unless a step says otherwise.

### 1. Install Clustal Omega with conda

Create a small environment that contains only the Clustal Omega binary:

```bash
conda create -n alignview-clustalo -c conda-forge -c bioconda clustalo
```

Check that the binary works:

```bash
conda run -n alignview-clustalo clustalo --version
```

Find the absolute path to the binary:

```bash
conda run -n alignview-clustalo which clustalo
```

The output should look similar to this:

```text
/home/your-user/miniconda3/envs/alignview-clustalo/bin/clustalo
```

### 2. Create `.env`

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and set `CLUSTALO_BIN` to the absolute path from the previous step:

```bash
CLUSTALO_BIN=/home/your-user/miniconda3/envs/alignview-clustalo/bin/clustalo
MSA_TIMEOUT_MS=60000
MSA_MAX_SEQUENCES=200
MSA_MAX_SEQUENCE_LENGTH=50000
MSA_MAX_TOTAL_LENGTH=500000
```

You do not need to activate the conda environment when running AlignView if `CLUSTALO_BIN` points to the full binary path.

### 3. Install nvm and Node.js

Install `nvm` from https://github.com/nvm-sh/nvm repo.

Load `nvm` in the current shell, or close and reopen the terminal:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
```

Install and use the current LTS Node.js release:

```bash
nvm install --lts
nvm use --lts
node --version
```

Enable pnpm through Corepack and activate the project package-manager version:

```bash
corepack enable
corepack prepare pnpm@11.5.1 --activate
pnpm --version
```

### 4. Install JavaScript dependencies

```bash
pnpm install
```

### 5. Build the app

```bash
pnpm build
```

### 6. Start the local server

Start the built Next.js server:

```bash
pnpm exec next start -p 3000
```

Open the app in a browser:

```text
http://localhost:3000
```

Restart the server after changing `.env`.

## Development Server

For development, use:

```bash
pnpm dev
```

This starts the app with live reload. Use the production-style build/start steps above when you want to test the deployed behavior.

## Usage

1. Paste two or more FASTA records into the input box.
2. Choose the sequence type, or leave it on auto-detect.
3. Adjust calculation options on the right side of the input box.
4. Adjust viewer options below the FASTA box, including coloring, block size, consensus, and ruler.
5. Click `Run alignment`.
6. Review the aligned blocks below the input panel.

### Viewer controls

- Hover over a residue to show sequence-specific alignment and original coordinates.
- Click one residue to select it.
- Click a second residue on the same sequence to select the range between them.
- Hover over another residue on the same sequence after the first click to preview the range.
- Use the `Copy range` button or press `Ctrl+C` / `Cmd+C` to copy the selected ungapped sequence range.
- Click outside the alignment to cancel the current selection.

## Coordinates

Alignment coordinates are shared across all sequences and count every aligned column, including gaps.

Original coordinates are sequence-specific and count only non-gap residues from the original input sequence. The API returns both maps:

- `alignmentToOriginal`: alignment column to original coordinate, or `null` for a gap.
- `originalToAlignment`: original coordinate to alignment column.

Hover behavior in the viewer uses these maps directly.

## Tests

```bash
pnpm test
```
