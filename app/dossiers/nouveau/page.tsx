"use client";
}}
>
<Card
title={t.t1.title}
desc={t.t1.desc}
cta={t.t1.cta}
onClick={() => go("/formulaire")}
/>
<Card
title={t.auto.title}
desc={t.auto.desc}
cta={t.auto.cta}
onClick={() => go("/formulaire?type=autonome")}
/>
<Card
title={t.t2.title}
desc={t.t2.desc}
cta={t.t2.cta}
onClick={() => go("/t2")}
/>
</div>
</div>
</main>
);
}


function Card({
title,
desc,
cta,
onClick,
}: {
title: string;
desc: string;
cta: string;
onClick: () => void;
}) {
return (
<div
className="card"
style={{
padding: 18,
display: "flex",
flexDirection: "column",
gap: 10,
minHeight: 170,
}}
>
<h3 style={{ margin: 0 }}>{title}</h3>
<p className="note" style={{ margin: 0 }}>{desc}</p>
<div style={{ marginTop: "auto" }}>
<button className="btn btn-primary" onClick={onClick}>
{cta}
</button>
</div>
</div>
);
}
