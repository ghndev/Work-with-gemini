export interface PieceData {
  id: string;
  groupId: string;
  correctX: number;
  correctY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  padding: number;
  canvas: HTMLCanvasElement;
  col: number;
  row: number;
}

export interface Edge {
  type: number;
  offset: number;
  tipOffset: number;
  neck: number;
  headLeft: number;
  headRight: number;
  depth: number;
}

export interface PuzzleState {
  imageUrl: string;
  cols: number;
  rows: number;
  hConnections: Edge[][];
  vConnections: Edge[][];
  pieces: {
    id: string;
    groupId: string;
    x: number;
    y: number;
    col: number;
    row: number;
  }[];
}

function createRandomEdge(): Edge {
  return {
    type: Math.random() > 0.5 ? 1 : -1,
    offset: (Math.random() - 0.5) * 0.06,
    tipOffset: (Math.random() - 0.5) * 0.04,
    neck: 0.09 + (Math.random() - 0.5) * 0.02,
    headLeft: 0.18 + (Math.random() - 0.5) * 0.02,
    headRight: 0.18 + (Math.random() - 0.5) * 0.02,
    depth: 0.22 + (Math.random() - 0.5) * 0.02,
  };
}

function drawEdge(ctx: CanvasRenderingContext2D, L: number, edge: Edge | null, sign: number, reverse: boolean) {
  if (!edge) {
    ctx.lineTo(L, 0);
    ctx.translate(L, 0);
    return;
  }

  const type = edge.type * sign;
  const depth = L * edge.depth * type;
  const neck = L * edge.neck;
  const headLeft = L * (reverse ? edge.headRight : edge.headLeft);
  const headRight = L * (reverse ? edge.headLeft : edge.headRight);
  const offset = reverse ? -edge.offset * L : edge.offset * L;
  const tipOffset = reverse ? -edge.tipOffset * L : edge.tipOffset * L;

  const center = L / 2 + offset;
  const tipX = center + tipOffset;

  ctx.lineTo(center - neck, 0);
  ctx.bezierCurveTo(
    center - neck, depth / 2,
    center - headLeft, depth,
    tipX, depth
  );
  ctx.bezierCurveTo(
    center + headRight, depth,
    center + neck, depth / 2,
    center + neck, 0
  );
  ctx.lineTo(L, 0);
  ctx.translate(L, 0);
}

export async function createPuzzleState(imageUrl: string, cols: number, rows: number): Promise<PuzzleState> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const hConnections: Edge[][] = [];
      for (let r = 0; r < rows - 1; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
          row.push(createRandomEdge());
        }
        hConnections.push(row);
      }

      const vConnections: Edge[][] = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols - 1; c++) {
          row.push(createRandomEdge());
        }
        vConnections.push(row);
      }

      const w = img.width / cols;
      const h = img.height / rows;
      const spacingX = w * 1.5;
      const spacingY = h * 1.5;
      
      const positions: {x: number, y: number}[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          positions.push({ x: c * spacingX, y: r * spacingY });
        }
      }
      
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }

      const pieces = [];
      let posIndex = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const id = `piece_${r}_${c}`;
          const pos = positions[posIndex++];
          pieces.push({
            id,
            groupId: id,
            x: pos.x,
            y: pos.y,
            col: c,
            row: r
          });
        }
      }

      resolve({
        imageUrl,
        cols,
        rows,
        hConnections,
        vConnections,
        pieces
      });
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}

export async function renderPuzzlePieces(state: PuzzleState): Promise<PieceData[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const pieces: PieceData[] = [];
      const { cols, rows, hConnections, vConnections } = state;
      const w = img.width / cols;
      const h = img.height / rows;
      const padding = Math.max(w, h) * 0.25;

      for (const pState of state.pieces) {
        const { r, c } = { r: pState.row, c: pState.col };
        const topEdge = r === 0 ? null : hConnections[r - 1][c];
        const bottomEdge = r === rows - 1 ? null : hConnections[r][c];
        const leftEdge = c === 0 ? null : vConnections[r][c - 1];
        const rightEdge = c === cols - 1 ? null : vConnections[r][c];

        const canvas = document.createElement('canvas');
        canvas.width = w + padding * 2;
        canvas.height = h + padding * 2;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        ctx.translate(padding, padding);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        drawEdge(ctx, w, topEdge, 1, false);
        ctx.rotate(Math.PI / 2);
        drawEdge(ctx, h, rightEdge, 1, false);
        ctx.rotate(Math.PI / 2);
        drawEdge(ctx, w, bottomEdge, -1, true);
        ctx.rotate(Math.PI / 2);
        drawEdge(ctx, h, leftEdge, -1, true);
        ctx.closePath();

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clip();

        ctx.drawImage(img, -c * w + padding, -r * h + padding);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        pieces.push({
          id: pState.id,
          groupId: pState.groupId,
          correctX: c * w,
          correctY: r * h,
          x: pState.x,
          y: pState.y,
          width: w,
          height: h,
          padding,
          canvas,
          col: c,
          row: r
        });
      }
      resolve(pieces);
    };
    img.onerror = reject;
    img.src = state.imageUrl;
  });
}
