export default function Hero({ title, image }: { title: string; image: string }) {
  return (
    <section style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>{title}</h1>
      {image && <img src={image} alt={title} style={{ maxWidth: '100%' }} />}
    </section>
  );
}
