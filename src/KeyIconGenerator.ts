export enum BadgeStyle {
    red = 'red',
    blue = 'blue',
    green = 'green',
}

function badgeFactory(radius: number, x: number, y: number): Path2D {
    const badge = new Path2D();
    badge.arc(x, y, radius, 0, 2 * Math.PI);
    return badge;
}

function renderBadgeWithScore(
    ctx: CanvasRenderingContext2D,
    style: BadgeStyle,
    score: number,
) {
    const badgeRadius = 10;
    const badgeX = 58;
    const badgeY = badgeX;
    const badgeScoreFontSize = badgeRadius;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.beginPath();

    // rendering badge background..
    ctx.fillStyle = style;
    const badge = badgeFactory(badgeRadius, badgeX, badgeY);
    ctx.fill(badge);

    // rendering badge score
    ctx.fillStyle = 'white';
    ctx.font = `bold ${badgeScoreFontSize}px sans-serif`;
    ctx.fillText(score.toString(), badgeX, badgeY + 1);
}

function renderBackgroundIcon(ctx: CanvasRenderingContext2D, canvasWidth: number, backgroundIconWidth: number, logoUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener('load', () => {
            ctx.drawImage(img, 0, 0, img.width, img.height, (canvasWidth - backgroundIconWidth) / 2, (canvasWidth - backgroundIconWidth) / 2, backgroundIconWidth, backgroundIconWidth);
            resolve();
        });
        img.src = logoUrl;
    });
}

export async function generateKeyIcon(mastoInstanceHost: string, style: BadgeStyle, score?: number): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    canvas.width = 72;
    canvas.height = canvas.width;
    const backgroundIconWidth = 56;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
        await renderBackgroundIcon(ctx, canvas.width, backgroundIconWidth, `https://${mastoInstanceHost}/favicon.ico`);
        if (score !== undefined) {
            renderBadgeWithScore(ctx, style, score);
        }
    }
    return canvas;
}