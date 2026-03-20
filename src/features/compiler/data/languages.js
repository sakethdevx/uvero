/**
 * Language configurations for the Uvero Online Compiler
 * Each language has metadata + multiple code templates
 */

export const LANGUAGES = [
    {
        id: 'python',
        name: 'Python 3',
        icon: '🐍',
        category: 'Interpreted',
        monaco: 'python',
        extension: '.py',
        templates: {
            hello: `# Welcome to Uvero Compiler — Python 3
print("Hello, World!")
print("This is Uvero Online Compiler 🚀")`,
            dataStructures: `# Python — Data Structures
fruits = ["apple", "banana", "cherry", "mango"]
print("Fruits:", fruits)
print("First:", fruits[0])
print("Sliced:", fruits[1:3])

# Dictionary
person = {"name": "Alice", "age": 25, "city": "Mumbai"}
for key, value in person.items():
    print(f"  {key}: {value}")`,
            algorithm: `# Python — Fibonacci Sequence
def fibonacci(n):
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

n = 15
print(f"First {n} Fibonacci numbers:")
print(fibonacci(n))`,
            io: `# Python — stdin / stdout
name = input("Enter your name: ")
age = int(input("Enter your age: "))
print(f"Hello {name}! You will be {age + 10} in 10 years.")`,
        },
    },
    {
        id: 'javascript',
        name: 'Node.js',
        icon: '🟨',
        category: 'Interpreted',
        monaco: 'javascript',
        extension: '.js',
        templates: {
            hello: `// Welcome to Uvero Compiler — Node.js
console.log("Hello, World!");
console.log("This is Uvero Online Compiler 🚀");`,
            dataStructures: `// Node.js — Data Structures
const fruits = ["apple", "banana", "cherry", "mango"];
console.log("Fruits:", fruits);
console.log("First:", fruits[0]);

const person = { name: "Alice", age: 25, city: "Mumbai" };
Object.entries(person).forEach(([key, value]) => {
    console.log(\`  \${key}: \${value}\`);
});`,
            algorithm: `// Node.js — Fibonacci Generator
function* fibonacci(n) {
    let a = 0, b = 1;
    for (let i = 0; i < n; i++) {
        yield a;
        [a, b] = [b, a + b];
    }
}

console.log("First 15 Fibonacci numbers:");
console.log([...fibonacci(15)].join(", "));`,
        },
    },
    {
        id: 'typescript',
        name: 'TypeScript',
        icon: '🔷',
        category: 'Interpreted',
        monaco: 'typescript',
        extension: '.ts',
        templates: {
            hello: `// Welcome to Uvero Compiler — TypeScript
const greeting: string = "Hello, World!";
console.log(greeting);
console.log("This is Uvero Online Compiler 🚀");`,
            algorithm: `// TypeScript — Generic Sorting
function bubbleSort<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = 0; i < result.length; i++) {
        for (let j = 0; j < result.length - i - 1; j++) {
            if (result[j] > result[j + 1]) {
                [result[j], result[j + 1]] = [result[j + 1], result[j]];
            }
        }
    }
    return result;
}

const numbers: number[] = [64, 34, 25, 12, 22, 11, 90];
console.log("Sorted:", bubbleSort(numbers));`,
        },
    },
    {
        id: 'c',
        name: 'C (GCC)',
        icon: '🔵',
        category: 'Compiled',
        monaco: 'c',
        extension: '.c',
        templates: {
            hello: `// Welcome to Uvero Compiler — C (GCC)
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    printf("This is Uvero Online Compiler\\n");
    return 0;
}`,
            algorithm: `// C — Bubble Sort
#include <stdio.h>

void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++)
        for (int j = 0; j < n - i - 1; j++)
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
}

int main() {
    int arr[] = {64, 34, 25, 12, 22, 11, 90};
    int n = sizeof(arr) / sizeof(arr[0]);
    bubbleSort(arr, n);
    printf("Sorted: ");
    for (int i = 0; i < n; i++) printf("%d ", arr[i]);
    printf("\\n");
    return 0;
}`,
            io: `// C — stdin / stdout
#include <stdio.h>

int main() {
    char name[100];
    int age;
    printf("Enter your name: ");
    scanf("%s", name);
    printf("Enter your age: ");
    scanf("%d", &age);
    printf("Hello %s! You will be %d in 10 years.\\n", name, age + 10);
    return 0;
}`,
        },
    },
    {
        id: 'cpp',
        name: 'C++ (G++)',
        icon: '🟦',
        category: 'Compiled',
        monaco: 'cpp',
        extension: '.cpp',
        templates: {
            hello: `// Welcome to Uvero Compiler — C++ (G++)
#include <iostream>
#include <string>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    cout << "This is Uvero Online Compiler" << endl;
    return 0;
}`,
            dataStructures: `// C++ — STL Containers
#include <iostream>
#include <vector>
#include <map>
using namespace std;

int main() {
    vector<string> fruits = {"apple", "banana", "cherry", "mango"};
    cout << "Fruits:" << endl;
    for (const auto& f : fruits) cout << "  " << f << endl;

    map<string, int> scores = {{"Alice", 95}, {"Bob", 87}, {"Charlie", 92}};
    cout << "\\nScores:" << endl;
    for (const auto& [name, score] : scores)
        cout << "  " << name << ": " << score << endl;
    return 0;
}`,
        },
    },
    {
        id: 'java',
        name: 'Java',
        icon: '☕',
        category: 'Compiled',
        monaco: 'java',
        extension: '.java',
        templates: {
            hello: `// Welcome to Uvero Compiler — Java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.println("This is Uvero Online Compiler");
    }
}`,
            algorithm: `// Java — Fibonacci with Streams
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        long[] fib = new long[15];
        fib[0] = 0; fib[1] = 1;
        for (int i = 2; i < 15; i++) fib[i] = fib[i-1] + fib[i-2];

        System.out.println("First 15 Fibonacci numbers:");
        String result = java.util.Arrays.stream(fib)
            .mapToObj(String::valueOf)
            .collect(Collectors.joining(", "));
        System.out.println(result);
    }
}`,
        },
    },
    {
        id: 'go',
        name: 'Go',
        icon: '🐹',
        category: 'Compiled',
        monaco: 'go',
        extension: '.go',
        templates: {
            hello: `// Welcome to Uvero Compiler — Go
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
    fmt.Println("This is Uvero Online Compiler")
}`,
            advanced: `// Go — Goroutines & Channels
package main

import (
    "fmt"
    "sync"
)

func square(wg *sync.WaitGroup, ch chan<- int, n int) {
    defer wg.Done()
    ch <- n * n
}

func main() {
    ch := make(chan int, 5)
    var wg sync.WaitGroup

    nums := []int{2, 3, 5, 7, 11}
    for _, n := range nums {
        wg.Add(1)
        go square(&wg, ch, n)
    }

    go func() { wg.Wait(); close(ch) }()

    fmt.Println("Squares:")
    for sq := range ch {
        fmt.Printf("  %d\\n", sq)
    }
}`,
        },
    },
    {
        id: 'rust',
        name: 'Rust',
        icon: '🦀',
        category: 'Compiled',
        monaco: 'rust',
        extension: '.rs',
        templates: {
            hello: `// Welcome to Uvero Compiler — Rust
fn main() {
    println!("Hello, World!");
    println!("This is Uvero Online Compiler");
}`,
            advanced: `// Rust — Ownership & Iterators
fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    let sum: i32 = numbers.iter().sum();
    let evens: Vec<&i32> = numbers.iter().filter(|&&x| x % 2 == 0).collect();
    let squares: Vec<i32> = numbers.iter().map(|&x| x * x).collect();

    println!("Numbers: {:?}", numbers);
    println!("Sum: {}", sum);
    println!("Evens: {:?}", evens);
    println!("Squares: {:?}", squares);
}`,
        },
    },
    {
        id: 'ruby',
        name: 'Ruby',
        icon: '💎',
        category: 'Interpreted',
        monaco: 'ruby',
        extension: '.rb',
        templates: {
            hello: `# Welcome to Uvero Compiler — Ruby
puts "Hello, World!"
puts "This is Uvero Online Compiler"

5.times { |i| puts "  Count: #{i + 1}" }`,
        },
    },
    {
        id: 'php',
        name: 'PHP',
        icon: '🐘',
        category: 'Interpreted',
        monaco: 'php',
        extension: '.php',
        templates: {
            hello: `<?php
// Welcome to Uvero Compiler — PHP
echo "Hello, World!\\n";
echo "This is Uvero Online Compiler\\n";

$fruits = ["apple", "banana", "cherry"];
foreach ($fruits as $i => $fruit) {
    echo "  " . ($i + 1) . ". " . $fruit . "\\n";
}
?>`,
        },
    },
    {
        id: 'perl',
        name: 'Perl',
        icon: '🐪',
        category: 'Interpreted',
        monaco: 'perl',
        extension: '.pl',
        templates: {
            hello: `#!/usr/bin/perl
# Welcome to Uvero Compiler — Perl
use strict;
use warnings;

print "Hello, World!\\n";
print "This is Uvero Online Compiler\\n";`,
        },
    },
    {
        id: 'r',
        name: 'R',
        icon: '📊',
        category: 'Interpreted',
        monaco: 'r',
        extension: '.r',
        templates: {
            hello: `# Welcome to Uvero Compiler — R
cat("Hello, World!\\n")
cat("This is Uvero Online Compiler\\n")

x <- c(10, 20, 30, 40, 50)
cat("Mean:", mean(x), "\\n")
cat("Sum:", sum(x), "\\n")`,
        },
    },
    {
        id: 'bash',
        name: 'Bash',
        icon: '🐚',
        category: 'Scripting',
        monaco: 'shell',
        extension: '.sh',
        templates: {
            hello: `#!/bin/bash
# Welcome to Uvero Compiler — Bash
echo "Hello, World!"
echo "This is Uvero Online Compiler"

for i in {1..5}; do
    echo "  Count: $i"
done`,
        },
    },
    {
        id: 'lua',
        name: 'Lua',
        icon: '🌙',
        category: 'Scripting',
        monaco: 'lua',
        extension: '.lua',
        templates: {
            hello: `-- Welcome to Uvero Compiler — Lua
print("Hello, World!")
print("This is Uvero Online Compiler")

for i = 1, 5 do
    print(string.format("  Count: %d", i))
end`,
        },
    },
    {
        id: 'swift',
        name: 'Swift',
        icon: '🐦',
        category: 'Compiled',
        monaco: 'swift',
        extension: '.swift',
        templates: {
            hello: `// Welcome to Uvero Compiler — Swift
print("Hello, World!")
print("This is Uvero Online Compiler")

let names = ["Alice", "Bob", "Charlie"]
for (i, name) in names.enumerated() {
    print("  \\(i + 1). \\(name)")
}`,
        },
    },
    {
        id: 'kotlin',
        name: 'Kotlin',
        icon: '🟣',
        category: 'Compiled',
        monaco: 'kotlin',
        extension: '.kt',
        templates: {
            hello: `// Welcome to Uvero Compiler — Kotlin
fun main() {
    println("Hello, World!")
    println("This is Uvero Online Compiler")

    val fruits = listOf("apple", "banana", "cherry")
    fruits.forEachIndexed { i, fruit ->
        println("  \${i + 1}. \$fruit")
    }
}`,
        },
    },
    {
        id: 'csharp',
        name: 'C# (Mono)',
        icon: '🟩',
        category: 'Compiled',
        monaco: 'csharp',
        extension: '.cs',
        templates: {
            hello: `// Welcome to Uvero Compiler — C# (Mono)
using System;
using System.Linq;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
        Console.WriteLine("This is Uvero Online Compiler");

        int[] numbers = {5, 3, 8, 1, 9, 2, 7};
        var sorted = numbers.OrderBy(n => n).ToArray();
        Console.WriteLine("Sorted: " + string.Join(", ", sorted));
    }
}`,
        },
    },
    {
        id: 'scala',
        name: 'Scala',
        icon: '🔴',
        category: 'Compiled',
        monaco: 'scala',
        extension: '.scala',
        templates: {
            hello: `// Welcome to Uvero Compiler — Scala
object Main extends App {
    println("Hello, World!")
    println("This is Uvero Online Compiler")

    val nums = List(1, 2, 3, 4, 5)
    println(s"Sum: \${nums.sum}")
    println(s"Double: \${nums.map(_ * 2)}")
}`,
        },
    },
    {
        id: 'haskell',
        name: 'Haskell (GHC)',
        icon: 'λ',
        category: 'Compiled',
        monaco: 'haskell',
        extension: '.hs',
        templates: {
            hello: `-- Welcome to Uvero Compiler — Haskell
main :: IO ()
main = do
    putStrLn "Hello, World!"
    putStrLn "This is Uvero Online Compiler"
    let fibs = take 10 $ map fib [0..]
    putStrLn $ "Fibonacci: " ++ show fibs
  where
    fib 0 = 0
    fib 1 = 1
    fib n = fib (n-1) + fib (n-2)`,
        },
    },
];

// Category groupings
export const CATEGORIES = [
    { id: 'compiled', name: 'Compiled', languages: LANGUAGES.filter(l => l.category === 'Compiled') },
    { id: 'interpreted', name: 'Interpreted', languages: LANGUAGES.filter(l => l.category === 'Interpreted') },
    { id: 'scripting', name: 'Scripting', languages: LANGUAGES.filter(l => l.category === 'Scripting') },
];

/**
 * Get the default template for a language
 */
export function getLanguageTemplate(langId, templateName = 'hello') {
    const lang = LANGUAGES.find(l => l.id === langId);
    if (!lang) return '// Language not found';
    return lang.templates[templateName] || lang.templates.hello || '// No template available';
}

/**
 * Get template names for a language
 */
export function getTemplateNames(langId) {
    const lang = LANGUAGES.find(l => l.id === langId);
    if (!lang) return [];
    return Object.keys(lang.templates).map(key => ({
        id: key,
        name: key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
    }));
}

/**
 * Find a language by ID
 */
export function getLanguageById(langId) {
    return LANGUAGES.find(l => l.id === langId);
}
