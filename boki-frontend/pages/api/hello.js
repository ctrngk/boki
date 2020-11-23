// Next.js API route support: https://nextjs.org/docs/api-routes/introduction


export default async (req, res) => {
    if (req.method === 'POST') {
      console.log(req.body)
    } else {
      // Handle any other HTTP method
    }
    res.statusCode = 200
    res.json({ name: 'John Doe' })
  }
