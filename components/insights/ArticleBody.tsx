import type { ArticleBlock } from "@/lib/content/types";
import styles from "./insights.module.css";

/** Renders article content blocks (paragraph, heading, steps, quote, table, callout, list). */
export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "p":
            return <p key={index}>{block.text}</p>;
          case "h2":
            return (
              <h2 key={block.id} id={block.id} className="t-feature-sm">
                {block.text}
              </h2>
            );
          case "ul":
            return (
              <ul key={index}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          case "steps":
            return (
              <ol key={index} className={styles.steps}>
                {block.items.map((item) => (
                  <li key={item.title}>
                    <strong>{item.title}</strong>
                    {item.text}
                  </li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <blockquote key={index} className={styles.blockquote}>
                {block.text}
              </blockquote>
            );
          case "table":
            return (
              <div key={index} className={styles.tableWrap}>
                <table>
                  {block.caption ? <caption>{block.caption}</caption> : null}
                  <thead>
                    <tr>
                      {block.headers.map((header) => (
                        <th key={header} scope="col">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "callout":
            return (
              <div key={index} className={styles.callout}>
                <strong>{block.title}</strong>
                {block.text}
              </div>
            );
        }
      })}
    </>
  );
}
