import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await axios.get(
      "https://crm.robotpos.com/rest/1/q5w7kffwsbyyct5i/crm.company.fields",
      {
        headers: {
          "Content-Type": "application/json",
          "Cookie": "qmb=0."
        }
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Error fetching company fields:", error);
    return res.status(500).json({ error: "Failed to fetch company fields" });
  }
}
