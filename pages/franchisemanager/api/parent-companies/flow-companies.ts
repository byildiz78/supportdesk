import { NextApiRequest, NextApiResponse } from 'next';
import axios from "axios";

// POST /franchisemanager/api/parent-companies/flow-companies - Flow firmaları getir
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const requestData = req.body;
    
    const response = await axios.post(
      "https://crm.robotpos.com/rest/1/q5w7kffwsbyyct5i/crm.company.list",
      requestData,
      {
        headers: {
          "Content-Type": "application/json",
          "Cookie": "qmb=0."
        }
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Error fetching flow companies:", error);
    return res.status(500).json({ error: "Failed to fetch flow companies" });
  }
}
