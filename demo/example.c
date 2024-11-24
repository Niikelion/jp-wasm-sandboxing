__attribute__((import_module("env"), import_name("print")))
extern void print(int);

void entry() {
    for (int i=0; i<16; ++i) print(i);
}
