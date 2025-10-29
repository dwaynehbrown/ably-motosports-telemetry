// v1
export function Card({ title, children }: { title: string; children: any }) {
    return <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
        {children}
    </div>;
}

export default Card