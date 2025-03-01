## Jawbts Webste Next

自己写的小网站罢了.

**功能** 

- 完整的身份验证系统, 对接github oauth2.0, 轮换jwk以及refresh token.
- 个人档案(其实就是个个性签名)
- 听音乐的

## 部署相关

注意, 它需要联动后端, 也就是[Jawbts API Next](https://github.com/winsrewu/jawbts-api-next/).  
请参照.env.example文件配置环境变量.  
关于api和api-domestic的区别, 参阅API的README.md.  
注意, origin指的是你这个服务部署的url, 也就是你访问这个网站的url.  

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

# 感谢
[vercel](https://vercel.com/) 提供免费服务托管  
[heroicons](https://github.com/tailwindlabs/heroicons) 提供图标  
[tailwindcss](https://tailwindcss.com/) 提供css框架  
[jose](https://www.npmjs.com/package/jose) 提供jwt加密解密库  
[react](https://reactjs.org/) [nextjs](https://nextjs.org/) 提供的框架  
[mp4box.js](https://github.com/gpac/mp4box.js) 提供MP4文件解析  
[ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) 提供各类格式支持  
[node-qrcode](https://github.com/soldair/node-qrcode) 生成二维码  

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
