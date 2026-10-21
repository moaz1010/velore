import bcrypt from 'bcryptjs';

function readHidden(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    const output = process.stdout;
    if (!input.isTTY || typeof input.setRawMode !== 'function') {
      reject(new Error('Run pnpm create-admin in an interactive terminal so the password is not echoed.'));
      return;
    }

    let value = '';
    output.write(prompt);
    input.setRawMode(true);
    input.resume();
    input.setEncoding('utf8');

    const cleanup = (): void => {
      input.off('data', onData);
      input.setRawMode(false);
      output.write('\n');
    };

    const onData = (chunk: string): void => {
      for (const character of chunk) {
        if (character === '\u0003') {
          cleanup();
          reject(new Error('Password entry cancelled.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          cleanup();
          resolve(value);
          return;
        }
        if (character === '\u007f' || character === '\b') {
          value = value.slice(0, -1);
          continue;
        }
        if (character >= ' ' && character !== '\u007f') value += character;
      }
    };

    input.on('data', onData);
  });
}

async function main(): Promise<void> {
  const password = await readHidden('New admin password (12–72 UTF-8 bytes): ');
  const confirmation = await readHidden('Confirm admin password: ');
  const byteLength = Buffer.byteLength(password, 'utf8');
  if (password !== confirmation) throw new Error('The passwords did not match.');
  if (byteLength < 12 || byteLength > 72) throw new Error('Use a password between 12 and 72 UTF-8 bytes.');

  const hash = await bcrypt.hash(password, 12);
  console.info('\nAdd this value to the protected ADMIN_PASSWORD_HASH environment setting:');
  console.info(hash);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Password hash generation failed.';
  console.error(message);
  process.exitCode = 1;
});
