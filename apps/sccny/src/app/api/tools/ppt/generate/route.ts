import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import PptxGenJS from "pptxgenjs";

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "ppt.generate");

    const { worshipOrderId } = await request.json();

    const order = await prisma.worshipOrder.findUnique({
      where: { id: worshipOrderId },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
    if (!order) {
      return NextResponse.json({ error: "Worship order not found" }, { status: 404 });
    }

    // Fetch template if specified
    let template = null;
    if (order.templateId) {
      template = await prisma.pptTemplate.findUnique({ where: { id: order.templateId } });
    }

    const pptx = new PptxGenJS();
    pptx.author = "SCCNY";
    pptx.title = order.name;

    const bgColor = (template?.backgroundColor || "#000000").replace("#", "");
    const txtColor = (template?.textColor || "#FFFFFF").replace("#", "");
    const titleSize = template?.titleFontSize || 36;
    const bodySize = template?.bodyFontSize || 24;
    const fontFace = template?.fontFamily || "Arial";

    // Title slide
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: bgColor };
    titleSlide.addText(order.name, {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 2,
      fontSize: titleSize,
      color: txtColor,
      align: "center",
      fontFace,
      bold: true,
    });
    titleSlide.addText(
      new Date(order.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      {
        x: 0.5,
        y: 3.5,
        w: 9,
        h: 1,
        fontSize: bodySize,
        color: txtColor,
        align: "center",
        fontFace,
      }
    );

    // Generate slides for each item
    for (const item of order.items) {
      const slide = pptx.addSlide();
      slide.background = { color: bgColor };

      // For HYMN items, fetch hymn data
      if (item.type === "HYMN" && item.hymnId) {
        const hymn = await prisma.hymn.findUnique({ where: { id: item.hymnId } });
        if (hymn) {
          slide.addText(hymn.titleZh + "\n" + hymn.titleEn, {
            x: 0.5,
            y: 0.3,
            w: 9,
            h: 1.2,
            fontSize: titleSize,
            color: txtColor,
            align: "center",
            fontFace,
            bold: true,
          });

          // Split lyrics into verses and create slides
          const lyricsLines = hymn.lyricsZh.split("\n\n");
          // First verse on this slide
          if (lyricsLines[0]) {
            slide.addText(lyricsLines[0], {
              x: 0.5,
              y: 1.8,
              w: 9,
              h: 4.5,
              fontSize: bodySize,
              color: txtColor,
              align: "center",
              fontFace,
            });
          }
          // Additional verses on new slides
          for (let i = 1; i < lyricsLines.length; i++) {
            const verseSlide = pptx.addSlide();
            verseSlide.background = { color: bgColor };
            verseSlide.addText(hymn.titleZh, {
              x: 0.5,
              y: 0.3,
              w: 9,
              h: 0.8,
              fontSize: Math.round(titleSize * 0.7),
              color: txtColor,
              align: "center",
              fontFace,
            });
            verseSlide.addText(lyricsLines[i], {
              x: 0.5,
              y: 1.5,
              w: 9,
              h: 5,
              fontSize: bodySize,
              color: txtColor,
              align: "center",
              fontFace,
            });
          }
          continue;
        }
      }

      // For other item types
      const slideTitle = item.titleZh || item.title || item.type.replace(/_/g, " ");
      slide.addText(slideTitle, {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 1.2,
        fontSize: titleSize,
        color: txtColor,
        align: "center",
        fontFace,
        bold: true,
      });

      if (item.contentZh || item.content) {
        slide.addText(item.contentZh || item.content || "", {
          x: 0.5,
          y: 2,
          w: 9,
          h: 4.5,
          fontSize: bodySize,
          color: txtColor,
          align: "center",
          fontFace,
        });
      }
      if (item.scriptureRef) {
        slide.addText(item.scriptureRef, {
          x: 0.5,
          y: 6,
          w: 9,
          h: 0.8,
          fontSize: Math.round(bodySize * 0.8),
          color: txtColor,
          align: "center",
          fontFace,
          italic: true,
        });
      }
    }

    const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${order.name.replace(/[^a-zA-Z0-9]/g, "_")}.pptx"`,
      },
    });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error generating PPT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
