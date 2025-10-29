This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

```

.env expects

RACE_ID=demo-123
NEXT_PUBLIC_ABLY_AUTH_URL=/api/ably/token
NEXT_PUBLIC_ABLY_DEBUG=true
CAR_A_HZ=5   # 5 Hz == every 200 ms
CAR_A_GPS_HZ=2
CAR_B_HZ=5
CAR_B_GPS_HZ=2
CAR_A_ID=car-a
CAR_B_ID=car-b
DEMO_PREMIUM=true
NEXT_PUBLIC_DEMO_PREMIUM=true
ABLY_API_KEY= --- your key ---

```

Simulate a 'premium' experience to gain full history and track wide notifications update .env

```
DEMO_PREMIUM=false
NEXT_PUBLIC_DEMO_false=true

```


Then, run the UI:

```bash
npm run dev

```

Then, start the publishers

```bash
npm run demo

```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
