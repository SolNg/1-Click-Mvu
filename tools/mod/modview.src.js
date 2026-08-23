/* eslint-disable */
// ============================================================================
// Man hinh "Mod the co san" — chi duoc chen vao ban build mod (src/index.mod.js).
//
// Muc dich: ap dung phan MVU / zod / thanh trang thai cua trinh tao the len mot
// the nhan vat + sach the gioi DA CO SAN, khong sinh lai bat ky noi dung nao.
//
// Chi ghi them, khong xoa noi dung nguoi dung tu viet:
//   - Ai()  chi thay the muc co extra.source cua chinh cong cu nay VA trung ten.
//   - Rr()/Qr() chi thay the script trung ten/id ("MVU", "Cau truc bien").
//   - oi()  chi thay the regex trung script_name, giu nguyen regex khac.
//   - Truong description / personality / anh bia cua the: khong dong toi.
// ============================================================================
const QzModRuntimeJson = "__QZ_MVU_RUNTIME_JSON__";

const QzModView = (0, r.defineComponent)({
  __name: "ModExistingCardView",
  props: {
    currentCharacter: {},
    worldbookName: {},
    isBusy: { type: Boolean },
  },
  emits: ["back", "update:worldbookName"],
  setup(n, { emit: e }) {
    const t = n,
      a = e,
      h = r.h,
      NO_CARD = "Chưa mở thẻ nhân vật";

    const roles = r.reactive([]),
      books = r.ref([]),
      primaryBook = r.ref(""),
      logs = r.ref([]),
      busy = r.ref(false),
      finished = r.ref(false),
      showUrls = r.ref(false),
      suggestions = r.ref([]),
      opt = r.reactive({
        mvu: true,
        runtime: true,
        schema: true,
        regex: true,
        placeholder: true,
        allGreetings: false,
        bindBook: false,
      });

    function log(kind, text) {
      logs.value = [...logs.value, { kind: kind, text: text, id: logs.value.length + 1 }].slice(-80);
    }
    function charName() {
      return String(t.currentCharacter || "").trim();
    }
    function bookName() {
      return String(t.worldbookName || "").trim();
    }
    function hasCard() {
      const c = charName();
      return Boolean(c) && c !== NO_CARD && !Pr(c);
    }
    function addRole(name) {
      roles.push({ name: String(name || ""), statusAvatarUrl: "", statusBackgroundUrl: "" });
    }
    function removeRole(i) {
      roles.splice(i, 1);
      if (roles.length === 0) addRole("");
    }
    function taken(name) {
      const v = String(name || "")
        .trim()
        .toLowerCase();
      return roles.some(
        (x) =>
          String(x.name || "")
            .trim()
            .toLowerCase() === v,
      );
    }
    function pickSuggestion(name) {
      if (taken(name)) return;
      const empty = roles.find((x) => !String(x.name || "").trim());
      if (empty) empty.name = name;
      else addRole(name);
    }
    function namedRoles() {
      return roles
        .filter((x) => String(x.name || "").trim())
        .map((x) => ({
          name: String(x.name).trim(),
          draft: {
            statusAvatarUrl: String(x.statusAvatarUrl || "").trim(),
            statusBackgroundUrl: String(x.statusBackgroundUrl || "").trim(),
          },
        }));
    }

    const issues = r.computed(() => {
      const out = [];
      if (!hasCard()) out.push("Chưa chọn thẻ nhân vật đích. Hãy quay lại bước trước để chọn hoặc tạo thẻ.");
      if (!bookName()) out.push("Chưa nhập tên sách thế giới.");
      const list = namedRoles();
      if (list.length === 0) out.push("Cần ít nhất một tên nhân vật để tạo biến thiện cảm.");
      const seen = new Set();
      for (const x of list) {
        if (seen.has(x.name)) out.push(`Tên nhân vật bị trùng: ${x.name}`);
        seen.add(x.name);
      }
      if (!opt.mvu && !opt.runtime && !opt.schema && !opt.regex && !opt.placeholder)
        out.push("Chưa chọn phần nào để cài đặt.");
      return Array.from(new Set(out));
    });
    const canRun = r.computed(() => issues.value.length === 0 && !busy.value && !t.isBusy);

    // --- Do tim ten nhan vat da co trong the / sach the gioi ---------------
    function namesFromInitvar(text) {
      const out = [];
      for (const line of String(text || "").split("\n")) {
        const m = line.match(/^([^\s:#][^:]*):\s*$/u);
        if (!m) continue;
        const key = m[1].trim();
        if (!key || key === "the_gioi" || key === "世界" || key === "stat_data") continue;
        out.push(key);
      }
      return out;
    }
    function namesFromSchema(text) {
      const out = [];
      for (const line of String(text || "").split("\n")) {
        const m = line.match(/^\s{2}(?:'([^']+)'|"([^"]+)"|([A-Za-z0-9_$À-ỹ]+))\s*:\s*z\.object\(/u);
        if (!m) continue;
        const key = (m[1] || m[2] || m[3] || "").trim();
        if (!key || key === "the_gioi" || key === "世界") continue;
        out.push(key);
      }
      return out;
    }
    // Muc do chinh cong cu nay tao cho tung nhan vat, ca ban Viet lan ban Trung goc.
    const ROLE_ENTRY_SUFFIX =
      /^(.+?)[_ ](?:Thông tin cơ bản|Bảng màu tính cách|Diễn giải bổ sung|Hồ sơ nhiều giai đoạn EJS)$/u;
    const ROLE_ENTRY_SUFFIX_ZH = /^(.+?)(?:角色速览|基础信息|性格调色盘|补充诠释|EJS调色盘多阶段人设)$/u;
    function entryKeys(entry) {
      const out = [];
      for (const src of [entry?.strategy?.keys, entry?.keys, entry?.key, entry?.strategy?.keys_secondary?.keys])
        if (Array.isArray(src)) for (const k of src) out.push(k);
      return out;
    }
    // Loc ung vien: bo cai chac chan khong phai ten nhan vat.
    function usableName(raw) {
      const v = String(raw ?? "").trim();
      if (!v || v.length > 40) return "";
      if (/[\n\r]/u.test(v)) return "";
      if (v.startsWith("[")) return "";
      if (/^[\d\s.,;:_-]+$/u.test(v)) return "";
      if (/^(the_gioi|世界|stat_data|Danh sách biến|Mục thế giới quan|Tóm tắt nhân vật)$/iu.test(v)) return "";
      return v;
    }
    // Doc het world book gan voi the: sach dich + sach chinh + cac sach phu.
    function targetBooks() {
      const out = [];
      const push = (x) => {
        const v = String(x || "").trim();
        if (v && !out.includes(v)) out.push(v);
      };
      push(bookName());
      if (hasCard()) {
        try {
          const bound = getCharWorldbookNames(getCurrentCharacterName() === charName() ? "current" : charName());
          push(bound?.primary);
          for (const x of bound?.additional || []) push(x);
        } catch {}
      }
      const known = getWorldbookNames() || [];
      return out.filter((x) => known.includes(x));
    }
    async function detect() {
      if (busy.value) return;
      busy.value = true;
      try {
        const sure = [],
          maybe = [];
        const books = targetBooks();
        let entryCount = 0;
        for (const book of books) {
          const entries = (await getWorldbook(book)) || [];
          entryCount += entries.length;
          for (const it of entries) {
            const name = String(it?.name || "").trim();
            // 1. Bien MVU da co: chac chan la ten nhan vat.
            if (/\[initvar\]/iu.test(name)) {
              for (const k of namesFromInitvar(it?.content)) sure.push(k);
              continue;
            }
            // 2. Muc nhan vat do chinh cong cu nay tao ra truoc day.
            const m = name.match(ROLE_ENTRY_SUFFIX) || name.match(ROLE_ENTRY_SUFFIX_ZH);
            if (m) {
              sure.push(m[1].trim());
              continue;
            }
            // 3. Muc khac cua cong cu (the gioi quan, quy tac...) khong phai nhan vat.
            if (it?.extra?.source && it.extra.source === Vr()) continue;
            // 4. Muc nguoi dung tu viet: ten muc va tu khoa kich hoat deu la ung vien.
            for (const cand of [name, ...entryKeys(it)]) {
              const v = usableName(cand);
              if (v) maybe.push(v);
            }
          }
        }
        if (books.length) log("info", `Đã đọc ${entryCount} mục trong ${books.length} world book: ${books.join(", ")}.`);
        else log("warn", `Thẻ chưa có world book nào — “${bookName()}” sẽ được tạo mới khi ghi.`);

        // 5. Script cau truc bien (zod) cua the.
        if (hasCard()) {
          try {
            await Wr(charName());
            const card = await getCharacter(charName());
            for (const sc of card?.extensions?.tavern_helper?.scripts ?? []) {
              if (!/registerMvuSchema/u.test(String(sc?.content || ""))) continue;
              for (const k of namesFromSchema(sc.content)) sure.push(k);
            }
          } catch (err) {
            log("warn", "Không đọc được script của thẻ: " + (err instanceof Error ? err.message : String(err)));
          }
        }

        const norm = (x) => x.trim().toLowerCase();
        const sureList = [];
        const seen = new Set();
        for (const x of sure) {
          const v = String(x || "").trim();
          if (!v || seen.has(norm(v))) continue;
          seen.add(norm(v));
          sureList.push(v);
        }
        const maybeList = [];
        for (const x of maybe) {
          if (seen.has(norm(x)) || maybeList.some((y) => norm(y) === norm(x))) continue;
          maybeList.push(x);
        }
        // Ten the xep cuoi: thuong la tieu de tac pham chu khong phai ten nhan vat.
        const cn = charName();
        if (hasCard() && !seen.has(norm(cn)) && !maybeList.some((y) => norm(y) === norm(cn))) maybeList.push(cn);
        suggestions.value = maybeList.slice(0, 60);

        if (sureList.length) {
          const keep = new Map();
          for (const x of roles) if (String(x.name || "").trim()) keep.set(String(x.name).trim(), x);
          roles.splice(0, roles.length);
          for (const name of sureList) {
            const old = keep.get(name);
            roles.push({
              name: name,
              statusAvatarUrl: old ? old.statusAvatarUrl : "",
              statusBackgroundUrl: old ? old.statusBackgroundUrl : "",
            });
          }
          log("success", `Đã lấy ${sureList.length} nhân vật đang có biến: ${sureList.join(", ")}`);
        } else if (suggestions.value.length) {
          log(
            "info",
            `Thẻ chưa có biến MVU nào. Có ${suggestions.value.length} tên lấy từ world book ở dưới — bấm vào tên nào là nhân vật cần theo dõi thiện cảm.`,
          );
        } else {
          log("warn", "Không đọc được tên nào từ world book. Hãy gõ tay tên nhân vật ở dưới.");
        }
      } catch (err) {
        log("error", err instanceof Error ? err.message : String(err));
      } finally {
        busy.value = false;
      }
    }

    // --- Cac buoc ghi -----------------------------------------------------
    async function ensureBook(book, char) {
      if (!getWorldbookNames().includes(book)) {
        await createWorldbook(book, []);
        log("success", `Đã tạo sách thế giới mới: ${book}`);
      }
      if (!opt.bindBook) return;
      await Wr(char);
      await updateCharacterWith(char, (c) => ((c.worldbook = book), c));
      if (getCurrentCharacterName() === char) {
        const cur = getCharWorldbookNames("current");
        await rebindCharWorldbooks("current", {
          primary: book,
          additional: (cur.additional || []).filter((x) => x !== book),
        });
      }
      log("success", `Đã gán “${book}” làm sách thế giới chính của thẻ.`);
    }
    async function attachPlaceholder(char) {
      await Wr(char);
      let touched = 0,
        seen = 0;
      await updateCharacterWith(char, (c) => {
        const list = c.first_messages ?? [];
        c.first_messages = list.map((m, i) => {
          if (i !== 0 && !opt.allGreetings) return m;
          const s = String(m ?? "");
          if (!s.trim()) return m;
          seen += 1;
          const next = Fo(s);
          if (next !== s) touched += 1;
          return next;
        });
        return c;
      });
      if (touched > 0) log("success", `Đã gắn <StatusPlaceHolderImpl/> vào ${touched} lời mở đầu.`);
      else if (seen > 0) log("info", "Lời mở đầu đã có sẵn thẻ thanh trạng thái, không cần sửa.");
      else
        log(
          "warn",
          "Thẻ chưa có lời mở đầu nào. Hãy viết lời mở đầu rồi thêm <StatusPlaceHolderImpl/> vào cuối để thanh trạng thái hiện ra.",
        );
    }
    async function run() {
      if (!canRun.value) return;
      busy.value = true;
      finished.value = false;
      logs.value = [];
      const char = charName(),
        book = bookName(),
        list = namedRoles();
      try {
        log("info", `Bắt đầu mod thẻ “${char}” với ${list.length} nhân vật.`);
        await Wr(char);
        if (opt.mvu) {
          await ensureBook(book, char);
          await Ai(book, Er(list));
          log("success", "Đã ghi khối biến MVU (khởi tạo, danh sách, quy tắc cập nhật, định dạng xuất).");
        } else if (opt.bindBook) {
          await ensureBook(book, char);
        }
        if (opt.runtime) {
          const raw = JSON.parse(QzModRuntimeJson);
          await Rr(
            char,
            Hr({
              type: raw.type ?? "script",
              name: String(raw.name ?? "MVU"),
              id: raw.id ?? zr("qz-mvu-runtime"),
              content: raw.content ?? "",
              info: raw.info ?? "",
              button: raw.button ?? { enabled: !0, buttons: [] },
              data: raw.data ?? {},
            }),
          );
          log("success", "Đã cài script runtime MVU.");
        }
        if (opt.schema) {
          await Dr(char, ur(list));
          log("success", "Đã cài script cấu trúc biến (zod).");
        }
        if (opt.regex) {
          await oi(char, hr(list));
          log("success", "Đã cài 6 regex hiển thị thanh trạng thái.");
        }
        if (opt.placeholder) await attachPlaceholder(char);
        finished.value = true;
        log("success", "Hoàn tất. Hãy mở lại đoạn chat của thẻ để MVU đọc biến khởi tạo.");
        toastr.success("Đã mod xong thẻ có sẵn", "Trình tạo thẻ nhân vật một chạm (mod)");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log("error", msg);
        toastr.error(msg, "Trình tạo thẻ nhân vật một chạm (mod)");
      } finally {
        busy.value = false;
      }
    }

    r.onMounted(() => {
      try {
        books.value = getWorldbookNames() || [];
      } catch {
        books.value = [];
      }
      if (hasCard()) {
        try {
          const bound = getCharWorldbookNames(getCurrentCharacterName() === charName() ? "current" : charName());
          primaryBook.value = String(bound?.primary || "");
        } catch {
          primaryBook.value = "";
        }
      }
      if (primaryBook.value) a("update:worldbookName", primaryBook.value);
      opt.bindBook = !primaryBook.value;
      if (roles.length === 0) addRole("");
      r.nextTick(() => detect());
    });
    r.watch(
      () => t.worldbookName,
      (v) => {
        opt.bindBook = Boolean(primaryBook.value) && String(v || "").trim() !== primaryBook.value;
      },
    );

    // --- Render -----------------------------------------------------------
    function panel(index, title, desc, body, span) {
      return h(
        "section",
        {
          class: "tool-panel",
          style: "display:grid;gap:12px;align-content:start" + (span ? ";grid-column:1/-1" : ""),
        },
        [
        h("div", { class: "tool-panel-head" }, [
          h("div", null, [
            h("span", { class: "panel-index" }, index),
            h("div", null, [h("h3", null, title), h("p", null, desc)]),
          ]),
        ]),
          h("div", { style: "display:grid;gap:10px" }, body),
        ],
      );
    }
    function check(key, label, hint) {
      return h("label", { style: "display:grid;grid-template-columns:18px 1fr;gap:8px;align-items:start" }, [
        h("input", {
          type: "checkbox",
          style: "width:16px;height:16px;margin-top:2px",
          checked: opt[key],
          disabled: busy.value,
          onChange: (ev) => (opt[key] = ev.target.checked),
        }),
        h("span", null, [
          h("strong", { style: "display:block;font-size:12px" }, label),
          h("small", { style: "display:block;font-weight:400;line-height:1.5" }, hint),
        ]),
      ]);
    }
    function roleRow(row, i) {
      return h(
        "div",
        {
          key: "role-" + i,
          style:
            "display:grid;gap:7px;padding:11px;border:1px solid var(--line);border-radius:13px;background:rgba(255,255,255,0.46)",
        },
        [
          h("div", { style: "display:grid;grid-template-columns:1fr auto;gap:7px;align-items:center" }, [
            h("input", {
              type: "text",
              value: row.name,
              placeholder: "Tên nhân vật đúng như trong thẻ",
              disabled: busy.value,
              style: "min-height:34px;padding:6px 11px",
              onInput: (ev) => (row.name = ev.target.value),
            }),
            h(
              "button",
              {
                type: "button",
                class: "ghost compact-button",
                disabled: busy.value,
                onClick: () => removeRole(i),
              },
              "Xoá",
            ),
          ]),
          showUrls.value
            ? h("div", { style: "display:grid;gap:6px" }, [
                h("input", {
                  type: "text",
                  value: row.statusAvatarUrl,
                  placeholder: "URL ảnh đại diện trên thanh trạng thái (tuỳ chọn)",
                  disabled: busy.value,
                  style: "min-height:32px;padding:5px 11px;font-size:11px",
                  onInput: (ev) => (row.statusAvatarUrl = ev.target.value),
                }),
                h("input", {
                  type: "text",
                  value: row.statusBackgroundUrl,
                  placeholder: "URL ảnh nền thanh trạng thái (tuỳ chọn)",
                  disabled: busy.value,
                  style: "min-height:32px;padding:5px 11px;font-size:11px",
                  onInput: (ev) => (row.statusBackgroundUrl = ev.target.value),
                }),
              ])
            : null,
          String(row.name || "").trim()
            ? h(
                "small",
                { style: "font-weight:400;line-height:1.5" },
                `Sẽ tạo biến stat_data.${String(row.name).trim()}.thien_cam (0–100).`,
              )
            : null,
        ],
      );
    }

    return () =>
      h("section", { class: "app-view mod-view", style: "display:grid;gap:14px;align-content:start" }, [
        h("div", { class: "view-heading" }, [
          h("div", null, [
            h("span", { class: "view-kicker" }, "MOD EXISTING CARD"),
            h("h2", null, "Mod thẻ nhân vật có sẵn"),
            h(
              "p",
              null,
              "Chỉ thêm phần biến MVU, cấu trúc zod và thanh trạng thái vào thẻ bạn đã làm sẵn. Không sinh lại thế giới quan, nhân vật hay lời mở đầu, và không đụng tới nội dung bạn tự viết.",
            ),
          ]),
          h(
            "button",
            { type: "button", class: "secondary", disabled: busy.value, onClick: () => a("back") },
            "← Quay lại",
          ),
        ]),
        h(
          "div",
          { style: "display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px" },
          [
            panel("01", "Đích ghi", "Thẻ và sách thế giới sẽ được bổ sung", [
              h("div", { class: "field" }, [
                h("span", null, "Thẻ nhân vật đích"),
                h(
                  "strong",
                  { style: "font-size:13px;color:var(--ink)" },
                  hasCard() ? charName() : "Chưa chọn — hãy quay lại bước trước",
                ),
              ]),
              h("div", { class: "field" }, [
                h("span", null, "Sách thế giới đích"),
                h("input", {
                  type: "text",
                  list: "qz-mod-books",
                  value: bookName(),
                  placeholder: "Tên sách thế giới của thẻ",
                  disabled: busy.value,
                  onInput: (ev) => a("update:worldbookName", ev.target.value),
                }),
                h(
                  "datalist",
                  { id: "qz-mod-books" },
                  books.value.map((b) => h("option", { key: b, value: b })),
                ),
                primaryBook.value
                  ? h(
                      "small",
                      { style: "font-weight:400;line-height:1.5" },
                      `Sách thế giới chính đang gắn với thẻ: ${primaryBook.value}`,
                    )
                  : h(
                      "small",
                      { style: "font-weight:400;line-height:1.5" },
                      "Thẻ này chưa gắn sách thế giới chính nào.",
                    ),
              ]),
              check(
                "bindBook",
                "Gán làm sách thế giới chính",
                "Bật khi thẻ chưa có sách thế giới, hoặc khi bạn muốn đổi sách chính sang sách ở trên.",
              ),
              h(
                "p",
                { style: "font-size:11px;line-height:1.55;color:var(--muted)" },
                "Chỉ những mục do chính công cụ này tạo ra mới bị ghi đè. Mọi mục, script và regex khác trong thẻ đều giữ nguyên.",
              ),
            ]),
            panel("02", "Nhân vật có thiện cảm", "Tên NPC trong thẻ, không phải tên thẻ", [
              h("div", { style: "display:flex;gap:7px;flex-wrap:wrap" }, [
                h(
                  "button",
                  { type: "button", class: "ghost compact-button", disabled: busy.value, onClick: () => detect() },
                  "Dò từ thẻ có sẵn",
                ),
                h(
                  "button",
                  { type: "button", class: "ghost compact-button", disabled: busy.value, onClick: () => addRole("") },
                  "Thêm nhân vật",
                ),
                h(
                  "button",
                  {
                    type: "button",
                    class: "ghost compact-button",
                    disabled: busy.value,
                    onClick: () => (showUrls.value = !showUrls.value),
                  },
                  showUrls.value ? "Ẩn ảnh thanh trạng thái" : "Ảnh thanh trạng thái",
                ),
              ]),
              h(
                "div",
                { style: "display:grid;gap:9px" },
                roles.map((row, i) => roleRow(row, i)),
              ),
              suggestions.value.length
                ? h("div", { style: "display:grid;gap:6px" }, [
                    h(
                      "small",
                      { style: "font-weight:400;line-height:1.5" },
                      "Tên đọc được từ world book của thẻ — bấm vào tên nào là nhân vật cần theo dõi thiện cảm:",
                    ),
                    h(
                      "div",
                      { style: "display:flex;gap:6px;flex-wrap:wrap" },
                      suggestions.value.map((name) =>
                        h(
                          "button",
                          {
                            key: "sg-" + name,
                            type: "button",
                            class: "ghost compact-button suggestion-chip",
                            disabled: busy.value || taken(name),
                            onClick: () => pickSuggestion(name),
                          },
                          name,
                        ),
                      ),
                    ),
                  ])
                : null,
            ]),
            panel("03", "Phần sẽ cài", "Bỏ chọn phần bạn không muốn đụng tới", [
              check(
                "mvu",
                "Khối biến MVU trong sách thế giới",
                "[initvar] khởi tạo biến, danh sách biến, [mvu_update] quy tắc và định dạng xuất.",
              ),
              check("runtime", "Script runtime MVU", "Nạp MagVarUpdate để thẻ tự xử lý biến sau mỗi lượt."),
              check("schema", "Script cấu trúc biến (zod)", "Ràng buộc kiểu và giá trị mặc định cho từng biến."),
              check("regex", "Regex thanh trạng thái", "6 regex: lọc suy nghĩ, gói cập nhật biến và vẽ thanh trạng thái."),
              check(
                "placeholder",
                "Gắn thanh trạng thái vào lời mở đầu có sẵn",
                "Thêm <StatusPlaceHolderImpl/> vào cuối lời mở đầu, không sửa chữ bạn đã viết.",
              ),
              opt.placeholder
                ? check("allGreetings", "Gắn cho cả lời chào thay thế", "Áp dụng cho toàn bộ danh sách lời mở đầu.")
                : null,
            ]),
            panel("04", "Chạy", "Kiểm tra rồi ghi vào thẻ", [
              issues.value.length
                ? h(
                    "ul",
                    { class: "issues", style: "display:grid;gap:5px;margin:0;padding-left:17px" },
                    issues.value.map((x, i) => h("li", { key: "iss" + i, style: "font-size:11px;font-weight:400" }, x)),
                  )
                : h(
                    "p",
                    { style: "font-size:11px;line-height:1.55;color:var(--muted)" },
                    "Đã đủ điều kiện. Nên sao lưu thẻ trước khi ghi nếu bạn muốn chắc chắn.",
                  ),
              h(
                "button",
                { type: "button", class: "primary", disabled: !canRun.value, onClick: () => run() },
                busy.value ? "Đang ghi vào thẻ…" : "Cài vào thẻ có sẵn",
              ),
              finished.value
                ? h("button", { type: "button", class: "secondary", onClick: () => a("back") }, "Xong, quay lại")
                : null,
              logs.value.length
                ? h(
                    "ul",
                    { class: "log-list", style: "display:grid;gap:5px;margin:0;padding:11px 13px;list-style:none" },
                    logs.value.map((it) =>
                      h(
                        "li",
                        {
                          key: it.id,
                          style:
                            "font-size:11px;line-height:1.55;color:" +
                            (it.kind === "error"
                              ? "var(--rose-deep)"
                              : it.kind === "warn"
                                ? "#9a6b2f"
                                : "var(--ink-soft)"),
                        },
                        it.text,
                      ),
                    ),
                  )
                : null,
            ], true),
          ],
        ),
      ]);
  },
});
