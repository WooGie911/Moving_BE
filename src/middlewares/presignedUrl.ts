import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Request, Response } from "express";
import { TUserRole } from "../types/user.types";

const generatePresignedUrl = async (req: Request, res: Response) => {
  try {
    const s3 = new S3Client({
      region: "ap-northeast-2",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const { userType } = req.user as { userType: TUserRole };
    const { filename, contentType } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({
        error: "filename과 contentType은 필수입니다.",
      });
    }

    // 역할 기반 폴더 설정
    const folderPrefix = userType === "MOVER" ? "mover" : "customer";
    const key = `${folderPrefix}/${Date.now()}_${filename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.ap-northeast-2.amazonaws.com/${key}`;

    return res.status(200).json({ uploadUrl, fileUrl, key });
  } catch (error) {
    console.error("❌ Presigned URL 생성 실패:", error);
    return res.status(500).json({
      error: "Presigned URL 생성 중 오류가 발생했습니다.",
    });
  }
};

export default generatePresignedUrl;
