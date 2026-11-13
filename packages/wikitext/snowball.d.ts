declare module "snowball-stemmers" {
  const snowball: {
    newStemmer(language: string): { stem(word: string): string };
  };

  export default snowball;
}
