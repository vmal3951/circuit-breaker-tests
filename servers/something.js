const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const log = async (s, delay, randomized) => {
  for (const c of s) {
    process.stdout.write(c);
    await sleep((randomized ? Math.random() : 1) * delay);
  }
  process.stdout.write('\n');
}

log('Hello, world!', 100, true);
log('What\'s up?', 100, true);
log('How are you?', 100, true);